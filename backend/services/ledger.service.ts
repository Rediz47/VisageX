import { getAdminDb } from './firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';

// ── Credit Ledger ───────────────────────────────────────────────────────────
// Every credit change is recorded as an immutable ledger entry.
// This provides: audit trail, fraud investigation, refund debugging.

export type LedgerReason =
  | 'analyze'           // -1 credit for AI analysis
  | 'celebrity_scan'    // -1 credit for celebrity lookalike
  | 'refund_ai_fail'   // +1 credit refunded (AI call failed)
  | 'refund_manual'    // +N manual refund by admin
  | 'purchase'         // +N from PayPal purchase
  | 'referral_invitee' // +1 invitee bonus
  | 'referral_inviter' // +N inviter tier bonus
  | 'dev_boost'        // dev-only credit boost
  | 'admin_grant'      // admin-granted credits
  | 'fraud_freeze';    // credits frozen by fraud system

export interface LedgerEntry {
  userId: string;
  change: number;          // positive = credit added, negative = credit spent
  reason: LedgerReason;
  balance_after?: number;  // snapshot of balance after this change (optional)
  metadata?: Record<string, any>; // extra context (orderId, scanId, etc.)
  ip?: string;
  timestamp: any;          // FieldValue.serverTimestamp()
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

    const entry: LedgerEntry = {
      userId,
      change,
      reason,
      metadata: metadata || {},
      ip: ip || undefined,
      timestamp: FieldValue.serverTimestamp(),
    };

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
      throw Object.assign(new Error('Insufficient credits'), { statusCode: 403, code: 'INSUFFICIENT_CREDITS' });
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
      timestamp: FieldValue.serverTimestamp(),
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
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[Ledger] Refund failed:', err);
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
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[Ledger] Add credits failed:', err);
  }
}
