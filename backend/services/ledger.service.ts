import { getAdminDb } from './firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';

// ── Dev Mode Bypass ──────────────────────────────────────────────────────────
// When Firestore quota is exhausted, dev accounts bypass credit checks.
const isDevRuntime = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;
const DEV_EMAILS = new Set(
  (process.env.DEV_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function isDevUser(email: string | null | undefined): boolean {
  return isDevRuntime && !!email && DEV_EMAILS.has(email.toLowerCase());
}

// ── Credit Ledger ───────────────────────────────────────────────────────────
// Every credit change is recorded as an immutable ledger entry.
// This provides: audit trail, fraud investigation, refund debugging.

export type LedgerReason =
  | 'analyze' // -1 credit for AI analysis
  | 'celebrity_scan' // -1 credit for celebrity lookalike
  | 'hair_scan' // -1 credit for hair analysis
  | 'refund_ai_fail' // +1 credit refunded (AI call failed)
  | 'refund_manual' // +N manual refund by admin
  | 'purchase' // +N from PayPal purchase
  | 'referral_invitee' // +1 invitee bonus
  | 'referral_inviter' // +N inviter tier bonus
  | 'dev_boost' // dev-only credit boost
  | 'admin_grant' // admin-granted credits
  | 'fraud_freeze'; // credits frozen by fraud system

export interface DeductOutcome {
  success: boolean; // true if credit was actually deducted
  newBalance?: number; // present only when success=true
  deferred?: boolean; // true if we couldn't deduct now (Firestore failure)
  //       but queued a pending_deducts record for later reconciliation
  queued?: boolean; // true if even the pending_deducts write failed (full outage)
  error?: string; // last error message encountered
  statusCode?: number; // 403 = insufficient credits, 404 = user not found, else transient
}

export interface LedgerEntry {
  userId: string;
  change: number; // positive = credit added, negative = credit spent
  reason: LedgerReason;
  balance_after?: number; // snapshot of balance after this change (optional)
  metadata?: Record<string, any>; // extra context (orderId, scanId, etc.)
  ip?: string;
  timestamp: any; // FieldValue.serverTimestamp()
}

/**
 * Records a credit change in the ledger collection.
 * This does NOT modify the user's balance — that's handled separately.
 * Call this AFTER a successful balance update.
 */
export async function recordLedgerEntry(
  userId: string,
  change: number,
  reason: LedgerReason,
  metadata?: Record<string, any>,
  ip?: string
): Promise<string | null> {
  try {
    const db = getAdminDb();
    if (!db) {
      console.error('[Ledger] Database not available');
      return null;
    }

    // Firestore rejects fields set to `undefined`. Only include `ip` if it's truthy.
    const entry: Record<string, any> = {
      userId,
      change,
      reason,
      metadata: metadata || {},
      timestamp: FieldValue.serverTimestamp()
    };
    if (ip) entry.ip = ip;

    const docRef = await db.collection('credits_ledger').add(entry);
    return docRef.id;
  } catch (err) {
    // Ledger write should never block the main flow
    console.error('[Ledger] Failed to record entry:', err);
    return null;
  }
}

/**
 * Atomically deducts credit AND records ledger entry in a single transaction.
 * Returns { success, newBalance } or throws on insufficient credits / user not found.
 */
export async function deductCreditWithLedger(
  userId: string,
  reason: LedgerReason,
  metadata?: Record<string, any>,
  ip?: string
): Promise<{ success: boolean; newBalance: number }> {
  const db = getAdminDb();
  if (!db) throw new Error('Database not initialized');

  const userRef = db.collection('users').doc(userId);

  const newBalance = await db.runTransaction(async (t) => {
    const userSnap = await t.get(userRef);
    if (!userSnap.exists) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    const currentCredits = userSnap.data()?.credits || 0;
    if (currentCredits < 1) {
      throw Object.assign(new Error('Insufficient credits'), {
        statusCode: 403,
        code: 'INSUFFICIENT_CREDITS'
      });
    }

    const updatedBalance = currentCredits - 1;
    t.update(userRef, { credits: FieldValue.increment(-1) });

    // Write ledger entry in same transaction
    const ledgerRef = db.collection('credits_ledger').doc();
    t.set(ledgerRef, {
      userId,
      change: -1,
      reason,
      balance_after: updatedBalance,
      metadata: metadata || {},
      ip: ip || null,
      timestamp: FieldValue.serverTimestamp()
    });

    return updatedBalance;
  });

  return { success: true, newBalance };
}

/**
 * Refunds a credit AND records it in the ledger.
 * Used when AI call fails after credit was already deducted.
 */
export async function refundCreditWithLedger(
  userId: string,
  reason: LedgerReason = 'refund_ai_fail',
  metadata?: Record<string, any>
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ credits: FieldValue.increment(1) });

    await db.collection('credits_ledger').add({
      userId,
      change: 1,
      reason,
      metadata: metadata || {},
      timestamp: FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[Ledger] Refund failed:', err);
  }
}

/**
 * Best-effort credit deduction used AFTER a successful AI call.
 *
 * The AI work has already been done and the user is getting their result, so we
 * must never fail the response if Firestore is momentarily unavailable. Flow:
 *
 *   1. Attempt the normal transactional deduct.
 *   2. On a business error (403 insufficient / 404 user missing), surface it so
 *      the caller can decide (usually: log, still return the result — we already
 *      rate-limit via Redis, so free-leak is bounded).
 *   3. On a transient error (quota, network, timeout), write a `pending_deducts`
 *      document. A one-off reconciliation script can drain these later.
 *   4. If even the pending write fails, return `queued: false` so the caller can
 *      log and move on. The response to the user is NOT blocked.
 *
 * Dev Mode: For dev emails, if Firestore fails (quota), we return success
 * without deducting credits, allowing testing to continue.
 */
export async function deductCreditBestEffort(
  userId: string,
  reason: LedgerReason,
  metadata?: Record<string, any>,
  ip?: string,
  userEmail?: string | null
): Promise<DeductOutcome> {
  try {
    const result = await deductCreditWithLedger(userId, reason, metadata, ip);
    return { success: true, newBalance: result.newBalance };
  } catch (err: any) {
    const statusCode = err?.statusCode;
    const msg = err?.message || String(err);

    // Business errors — propagate them so the route returns 403/404 to the client.
    if (statusCode === 403 || statusCode === 404) {
      return { success: false, error: msg, statusCode };
    }

    // Transient (quota, timeout, network). Try to queue a pending_deducts intent
    // so a later reconciliation can charge this user once Firestore is healthy.
    console.error('[Ledger] Deduct failed; queueing pending_deducts:', msg);

    // DEV MODE BYPASS: If Firestore quota exhausted and this is a dev account,
    // allow the request to proceed so testing can continue.
    if (isDevRuntime && isDevUser(userEmail) && msg?.toLowerCase().includes('quota')) {
      console.log(
        `[Ledger] Dev bypass for ${userEmail}: allowing free analysis due to quota exhaustion`
      );
      return { success: true, newBalance: 9999 };
    }

    try {
      const db = getAdminDb();
      if (db) {
        await db.collection('pending_deducts').add({
          userId,
          change: -1,
          reason,
          metadata: metadata || {},
          ip: ip || null,
          error: msg.slice(0, 400),
          createdAt: FieldValue.serverTimestamp()
        });
        return { success: false, deferred: true, error: msg };
      }
    } catch (queueErr: any) {
      console.error('[Ledger] Failed to queue pending_deducts:', queueErr?.message || queueErr);
    }
    return { success: false, deferred: true, queued: false, error: msg };
  }
}

/**
 * Records a credit addition (purchase, referral, etc.) with ledger entry.
 */
export async function addCreditsWithLedger(
  userId: string,
  amount: number,
  reason: LedgerReason,
  metadata?: Record<string, any>
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ credits: FieldValue.increment(amount) });

    await db.collection('credits_ledger').add({
      userId,
      change: amount,
      reason,
      metadata: metadata || {},
      timestamp: FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('[Ledger] Add credits failed:', err);
  }
}
