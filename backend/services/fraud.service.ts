import { getAdminDb } from './firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

// ── Fraud Detection System ──────────────────────────────────────────────────
// Tracks user behavior patterns to detect:
// - Multi-account abuse (same IP/device, multiple accounts)
// - Referral fraud loops
// - Unusual credit consumption spikes
// - Bot-like request patterns

export type FraudSignalType =
  | 'multi_account_ip'       // Multiple accounts from same IP
  | 'multi_account_device'   // Multiple accounts from same device fingerprint
  | 'referral_loop'          // Self-referral or circular referrals
  | 'credit_spike'           // Abnormal credit usage rate
  | 'rapid_requests'         // Too many requests in short window
  | 'suspicious_payment'     // Payment anomaly
  | 'ip_mismatch';           // Sudden IP geo shift

export type FraudAction = 'flag' | 'soft_ban' | 'require_captcha' | 'hard_ban';

export interface FraudSignal {
  userId: string;
  type: FraudSignalType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: FraudAction;
  details: Record<string, any>;
  ip?: string;
  deviceFingerprint?: string;
  createdAt: any;
}

export interface UserRiskProfile {
  userId: string;
  riskScore: number;          // 0-100
  flags: FraudSignalType[];
  status: 'clean' | 'flagged' | 'soft_banned' | 'banned';
  ipHistory: string[];
  deviceHistory: string[];
  lastActivity: any;
  requiresCaptcha: boolean;
}

// ── In-memory risk profile cache ─────────────────────────────────────────────
// Caches user_risk_profiles docs for RISK_CACHE_TTL_MS to avoid hammering
// Firestore on every request. A 5-minute TTL is safe because risk status
// changes are rare and a short delay in enforcement is acceptable.
const RISK_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RISK_CACHE_MAX_SIZE = 500;

interface CachedRiskProfile {
  profile: UserRiskProfile | null; // null = document does not exist
  fetchedAt: number;
}

const riskProfileCache = new Map<string, CachedRiskProfile>();

function getCachedRiskProfile(userId: string): UserRiskProfile | null | undefined {
  const entry = riskProfileCache.get(userId);
  if (!entry) return undefined; // cache miss
  if (Date.now() - entry.fetchedAt > RISK_CACHE_TTL_MS) {
    riskProfileCache.delete(userId);
    return undefined; // expired
  }
  return entry.profile;
}

function setCachedRiskProfile(userId: string, profile: UserRiskProfile | null): void {
  // Evict oldest entries if cache is full
  if (riskProfileCache.size >= RISK_CACHE_MAX_SIZE) {
    const firstKey = riskProfileCache.keys().next().value;
    if (firstKey) riskProfileCache.delete(firstKey);
  }
  riskProfileCache.set(userId, { profile, fetchedAt: Date.now() });
}

function invalidateCachedRiskProfile(userId: string): void {
  riskProfileCache.delete(userId);
}

// ── Thresholds (configurable via env) ────────────────────────────────────────
const THRESHOLDS = {
  MAX_ACCOUNTS_PER_IP: Number(process.env.FRAUD_MAX_ACCOUNTS_PER_IP) || 3,
  MAX_ACCOUNTS_PER_DEVICE: 2,
  MAX_REFERRALS_PER_HOUR: Number(process.env.FRAUD_MAX_REFERRALS_PER_HOUR) || 5,
  SCAN_SPIKE_THRESHOLD: Number(process.env.FRAUD_SCAN_SPIKE_THRESHOLD) || 20, // scans per hour
  RISK_SCORE_FLAG: 30,
  RISK_SCORE_SOFT_BAN: 60,
  RISK_SCORE_BAN: 90,
};

/**
 * Generates a device fingerprint from request headers using SHA-256.
 * Uses 8+ header signals for higher entropy than a simple UA hash.
 * If a client-provided fingerprint is available, it's mixed in for even
 * stronger device anchoring (e.g. from FingerprintJS on the client).
 */
export function generateDeviceFingerprint(
  headers: Record<string, any>,
  clientFingerprint?: string,
): string {
  const signals = [
    headers['user-agent'] || '',
    headers['accept-language'] || '',
    headers['accept-encoding'] || '',
    headers['sec-ch-ua-platform'] || '',
    headers['sec-ch-ua'] || '',
    headers['sec-ch-ua-mobile'] || '',
    headers['accept'] || '',
    headers['connection'] || '',
  ];

  // If the client sent a JS-generated fingerprint, include it as an anchor
  if (clientFingerprint) {
    signals.push(`client:${clientFingerprint}`);
  }

  const raw = signals.join('|');
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Tracks user activity and checks for fraud signals.
 * Call on every authenticated API request.
 */
export async function trackActivity(
  userId: string,
  ip: string,
  deviceFingerprint: string,
  action: string
): Promise<{ allowed: boolean; requiresCaptcha: boolean; reason?: string }> {
  const db = getAdminDb();
  if (!db) return { allowed: true, requiresCaptcha: false };

  try {
    // Use cache to avoid redundant Firestore reads
    const cached = getCachedRiskProfile(userId);
    const riskRef = db.collection('user_risk_profiles').doc(userId);
    let profile: UserRiskProfile | null;

    if (cached !== undefined) {
      profile = cached;
    } else {
      const riskSnap = await riskRef.get();
      profile = riskSnap.exists ? (riskSnap.data() as UserRiskProfile) : null;
      setCachedRiskProfile(userId, profile);
    }

    if (profile) {
      // Hard ban — reject immediately
      if (profile.status === 'banned') {
        return { allowed: false, requiresCaptcha: false, reason: 'Account suspended' };
      }

      // Soft ban — allow but require captcha
      if (profile.status === 'soft_banned' || profile.requiresCaptcha) {
        return { allowed: true, requiresCaptcha: true, reason: 'Verification required' };
      }

      // Update activity record
      const updates: Record<string, any> = {
        lastActivity: FieldValue.serverTimestamp(),
      };

      // Track IP history (keep last 10)
      if (ip && !profile.ipHistory?.includes(ip)) {
        const newHistory = [...(profile.ipHistory || []), ip].slice(-10);
        updates.ipHistory = newHistory;
      }

      // Track device history (keep last 5)
      if (deviceFingerprint && !profile.deviceHistory?.includes(deviceFingerprint)) {
        const newHistory = [...(profile.deviceHistory || []), deviceFingerprint].slice(-5);
        updates.deviceHistory = newHistory;
      }

      await riskRef.update(updates);
    } else {
      // First time seeing this user — create clean profile
      const newProfile: UserRiskProfile = {
        userId,
        riskScore: 0,
        flags: [],
        status: 'clean',
        ipHistory: ip ? [ip] : [],
        deviceHistory: deviceFingerprint ? [deviceFingerprint] : [],
        lastActivity: FieldValue.serverTimestamp(),
        requiresCaptcha: false,
      };
      await riskRef.set(newProfile);
      setCachedRiskProfile(userId, newProfile);
    }

    // Log activity via batched writer (avoids per-request Firestore writes)
    enqueueActivityLog({ userId, ip, deviceFingerprint, action });

    return { allowed: true, requiresCaptcha: false };
  } catch (err) {
    // Fraud check should never block legitimate requests
    console.error('[Fraud] Activity tracking error:', err);
    return { allowed: true, requiresCaptcha: false };
  }
}

/**
 * Checks for multi-account abuse on the same IP.
 * Call during user registration / referral redemption.
 */
export async function checkMultiAccountAbuse(
  userId: string,
  ip: string,
  deviceFingerprint?: string
): Promise<{ suspicious: boolean; accountCount: number }> {
  const db = getAdminDb();
  if (!db) return { suspicious: false, accountCount: 0 };

  try {
    // Check how many users share this IP
    const ipQuery = await db.collection('user_risk_profiles')
      .where('ipHistory', 'array-contains', ip)
      .limit(THRESHOLDS.MAX_ACCOUNTS_PER_IP + 1)
      .get();

    const accountCount = ipQuery.size;

    if (accountCount >= THRESHOLDS.MAX_ACCOUNTS_PER_IP) {
      // Flag all accounts on this IP
      await raiseSignal(userId, 'multi_account_ip', 'medium', 'flag', {
        ip,
        sharedAccountCount: accountCount,
      });
      return { suspicious: true, accountCount };
    }

    // Check device fingerprint overlap
    if (deviceFingerprint) {
      const deviceQuery = await db.collection('user_risk_profiles')
        .where('deviceHistory', 'array-contains', deviceFingerprint)
        .limit(THRESHOLDS.MAX_ACCOUNTS_PER_DEVICE + 1)
        .get();

      if (deviceQuery.size >= THRESHOLDS.MAX_ACCOUNTS_PER_DEVICE) {
        await raiseSignal(userId, 'multi_account_device', 'high', 'require_captcha', {
          deviceFingerprint,
          sharedAccountCount: deviceQuery.size,
        });
        return { suspicious: true, accountCount: deviceQuery.size };
      }
    }

    return { suspicious: false, accountCount };
  } catch (err) {
    console.error('[Fraud] Multi-account check error:', err);
    return { suspicious: false, accountCount: 0 };
  }
}

/**
 * Checks for referral abuse patterns.
 * Call during referral redemption.
 */
export async function checkReferralAbuse(
  inviteeId: string,
  inviterId: string,
  ip: string
): Promise<{ blocked: boolean; reason?: string }> {
  const db = getAdminDb();
  if (!db) return { blocked: false };

  try {
    // 1. Check if inviter and invitee share IP (self-referral)
    const inviterProfile = await db.collection('user_risk_profiles').doc(inviterId).get();
    if (inviterProfile.exists) {
      const inviterIps = inviterProfile.data()?.ipHistory || [];
      if (inviterIps.includes(ip)) {
        await raiseSignal(inviteeId, 'referral_loop', 'high', 'soft_ban', {
          inviterId,
          sharedIp: ip,
        });
        return { blocked: true, reason: 'Referral abuse detected' };
      }
    }

    // 2. Check referral velocity (too many redeems from same inviter in short time)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReferrals = await db.collection('credits_ledger')
      .where('metadata.inviterId', '==', inviterId)
      .where('reason', '==', 'referral_invitee')
      .where('timestamp', '>=', oneHourAgo)
      .limit(THRESHOLDS.MAX_REFERRALS_PER_HOUR + 1)
      .get();

    if (recentReferrals.size >= THRESHOLDS.MAX_REFERRALS_PER_HOUR) {
      await raiseSignal(inviterId, 'referral_loop', 'high', 'soft_ban', {
        referralsInLastHour: recentReferrals.size,
      });
      return { blocked: true, reason: 'Too many referrals in short time' };
    }

    return { blocked: false };
  } catch (err) {
    console.error('[Fraud] Referral abuse check error:', err);
    return { blocked: false };
  }
}

/**
 * Checks if a user has abnormal scan frequency (credit consumption spike).
 * Call before AI analysis.
 */
export async function checkScanSpike(userId: string): Promise<{ spikeDetected: boolean }> {
  const db = getAdminDb();
  if (!db) return { spikeDetected: false };

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentScans = await db.collection('credits_ledger')
      .where('userId', '==', userId)
      .where('reason', 'in', ['analyze', 'celebrity_scan'])
      .where('timestamp', '>=', oneHourAgo)
      .limit(THRESHOLDS.SCAN_SPIKE_THRESHOLD + 1)
      .get();

    if (recentScans.size >= THRESHOLDS.SCAN_SPIKE_THRESHOLD) {
      await raiseSignal(userId, 'credit_spike', 'high', 'require_captcha', {
        scansInLastHour: recentScans.size,
      });
      return { spikeDetected: true };
    }

    return { spikeDetected: false };
  } catch (err) {
    console.error('[Fraud] Scan spike check error:', err);
    return { spikeDetected: false };
  }
}

/**
 * Raises a fraud signal and updates user risk profile.
 */
async function raiseSignal(
  userId: string,
  type: FraudSignalType,
  severity: FraudSignal['severity'],
  action: FraudAction,
  details: Record<string, any>
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  try {
    // Record the signal
    await db.collection('fraud_signals').add({
      userId,
      type,
      severity,
      action,
      details,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update risk profile
    const riskRef = db.collection('user_risk_profiles').doc(userId);
    const riskSnap = await riskRef.get();

    const severityScore = { low: 10, medium: 25, high: 50, critical: 80 };
    const addedScore = severityScore[severity];

    if (riskSnap.exists) {
      const current = riskSnap.data()!;
      const newScore = Math.min(100, (current.riskScore || 0) + addedScore);
      const flags = [...new Set([...(current.flags || []), type])];

      let status: UserRiskProfile['status'] = current.status;
      let requiresCaptcha = current.requiresCaptcha || false;

      if (newScore >= THRESHOLDS.RISK_SCORE_BAN) {
        status = 'banned';
      } else if (newScore >= THRESHOLDS.RISK_SCORE_SOFT_BAN) {
        status = 'soft_banned';
        requiresCaptcha = true;
      } else if (newScore >= THRESHOLDS.RISK_SCORE_FLAG) {
        status = 'flagged';
      }

      if (action === 'require_captcha') requiresCaptcha = true;
      if (action === 'soft_ban') status = 'soft_banned';
      if (action === 'hard_ban') status = 'banned';

      await riskRef.update({
        riskScore: newScore,
        flags,
        status,
        requiresCaptcha,
      });
      invalidateCachedRiskProfile(userId);
    } else {
      const newScore = addedScore;
      await riskRef.set({
        userId,
        riskScore: newScore,
        flags: [type],
        status: newScore >= THRESHOLDS.RISK_SCORE_SOFT_BAN ? 'soft_banned' : 'flagged',
        ipHistory: [],
        deviceHistory: [],
        lastActivity: FieldValue.serverTimestamp(),
        requiresCaptcha: action === 'require_captcha' || action === 'soft_ban',
      });
      invalidateCachedRiskProfile(userId);
    }

    console.warn(`[Fraud] Signal raised: ${type} for user ${userId} (severity: ${severity}, action: ${action})`);
  } catch (err) {
    console.error('[Fraud] Failed to raise signal:', err);
  }
}

/**
 * Gets the risk status for a user (used by middleware).
 * Returns quickly from cache/profile.
 */
export async function getUserRiskStatus(userId: string): Promise<{
  allowed: boolean;
  requiresCaptcha: boolean;
  status: string;
  riskScore: number;
}> {
  const db = getAdminDb();
  if (!db) return { allowed: true, requiresCaptcha: false, status: 'clean', riskScore: 0 };

  try {
    // Check cache first to avoid Firestore read
    let profile: UserRiskProfile | null;
    const cached = getCachedRiskProfile(userId);

    if (cached !== undefined) {
      profile = cached;
    } else {
      const riskSnap = await db.collection('user_risk_profiles').doc(userId).get();
      profile = riskSnap.exists ? (riskSnap.data() as UserRiskProfile) : null;
      setCachedRiskProfile(userId, profile);
    }

    if (!profile) return { allowed: true, requiresCaptcha: false, status: 'clean', riskScore: 0 };

    if (profile.status === 'banned') {
      return { allowed: false, requiresCaptcha: false, status: 'banned', riskScore: profile.riskScore || 0 };
    }

    return {
      allowed: true,
      requiresCaptcha: profile.requiresCaptcha || profile.status === 'soft_banned',
      status: profile.status,
      riskScore: profile.riskScore || 0,
    };
  } catch (err) {
    console.error('[Fraud] Risk status check error:', err);
    return { allowed: true, requiresCaptcha: false, status: 'unknown', riskScore: 0 };
  }
}

// ── Preemptive Risk Gate ─────────────────────────────────────────────────────
// Threshold above which expensive operations (AI calls) are blocked outright,
// even if the user isn't fully banned yet. This prevents burning money on
// abusive accounts before the ban escalation catches up.
const RISK_SCORE_BLOCK_EXPENSIVE = Number(process.env.FRAUD_RISK_BLOCK_EXPENSIVE) || 70;

/**
 * Preemptive gate for expensive operations (AI analysis, celebrity scan).
 * Returns { blocked, reason } — check BEFORE deducting credits or calling AI.
 * This is intentionally stricter than getUserRiskStatus: it blocks at score 70
 * instead of waiting for a full ban (90).
 */
export async function isHighRiskForExpensiveOp(userId: string): Promise<{
  blocked: boolean;
  reason?: string;
  riskScore: number;
}> {
  const db = getAdminDb();
  if (!db) return { blocked: false, riskScore: 0 };

  try {
    // Check cache first to avoid Firestore read
    let profile: UserRiskProfile | null;
    const cached = getCachedRiskProfile(userId);

    if (cached !== undefined) {
      profile = cached;
    } else {
      const riskSnap = await db.collection('user_risk_profiles').doc(userId).get();
      profile = riskSnap.exists ? (riskSnap.data() as UserRiskProfile) : null;
      setCachedRiskProfile(userId, profile);
    }

    if (!profile) return { blocked: false, riskScore: 0 };

    if (profile.status === 'banned') {
      return { blocked: true, reason: 'Account suspended', riskScore: profile.riskScore || 0 };
    }

    if ((profile.riskScore || 0) >= RISK_SCORE_BLOCK_EXPENSIVE) {
      console.warn(`[Fraud] Preemptive block: user ${userId} has riskScore ${profile.riskScore} (threshold: ${RISK_SCORE_BLOCK_EXPENSIVE})`);
      return {
        blocked: true,
        reason: 'Your account has been flagged for unusual activity. Please contact support.',
        riskScore: profile.riskScore || 0,
      };
    }

    return { blocked: false, riskScore: profile.riskScore || 0 };
  } catch (err) {
    console.error('[Fraud] High-risk check error:', err);
    return { blocked: false, riskScore: 0 };
  }
}

// ── Batched Activity Logger ─────────────────────────────────────────────────
// Instead of writing one Firestore doc per request, we buffer entries in
// memory and flush them in a batch every FLUSH_INTERVAL_MS or when the
// buffer hits MAX_BUFFER_SIZE. This cuts Firestore writes by ~95% under
// normal traffic.

interface ActivityLogEntry {
  userId: string;
  ip: string;
  deviceFingerprint: string;
  action: string;
}

const ACTIVITY_BUFFER: ActivityLogEntry[] = [];
const MAX_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000; // 30 seconds

function enqueueActivityLog(entry: ActivityLogEntry) {
  ACTIVITY_BUFFER.push(entry);
  if (ACTIVITY_BUFFER.length >= MAX_BUFFER_SIZE) {
    flushActivityLogs();
  }
}

async function flushActivityLogs() {
  if (ACTIVITY_BUFFER.length === 0) return;

  const db = getAdminDb();
  if (!db) {
    ACTIVITY_BUFFER.length = 0;
    return;
  }

  // Drain the buffer atomically
  const entries = ACTIVITY_BUFFER.splice(0, ACTIVITY_BUFFER.length);

  try {
    // Firestore batched writes (max 500 per batch)
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    for (const entry of entries) {
      const ref = db.collection('activity_log').doc();
      batch.set(ref, {
        ...entry,
        timestamp: now,
      });
    }
    await batch.commit();
  } catch (err) {
    console.error(`[Fraud] Failed to flush ${entries.length} activity logs:`, err);
    // Don't re-enqueue — accept data loss for logs rather than OOM
  }
}

// Flush on a timer so low-traffic periods still get written
const _flushTimer = setInterval(flushActivityLogs, FLUSH_INTERVAL_MS);
// Don't prevent Node from exiting
if (_flushTimer.unref) _flushTimer.unref();

/**
 * Purges activity_log entries older than `retentionDays`.
 * Call from a Cloud Function schedule or admin endpoint.
 * Deletes in batches of 200 to stay within Firestore limits.
 */
export async function purgeOldActivityLogs(retentionDays = 30): Promise<number> {
  const db = getAdminDb();
  if (!db) return 0;

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  let totalDeleted = 0;

  try {
    let hasMore = true;
    while (hasMore) {
      const snap = await db.collection('activity_log')
        .where('timestamp', '<', cutoff)
        .limit(200)
        .get();

      if (snap.empty) {
        hasMore = false;
        break;
      }

      const batch = db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += snap.size;

      // Small delay to avoid hammering Firestore
      await new Promise(r => setTimeout(r, 100));
    }

    if (totalDeleted > 0) {
      console.log(`[Fraud] Purged ${totalDeleted} activity logs older than ${retentionDays} days`);
    }
    return totalDeleted;
  } catch (err) {
    console.error('[Fraud] Activity log purge error:', err);
    return totalDeleted;
  }
}
