/**
 * One-shot credit-restore / grant utility.
 *
 * Use cases:
 *   - Refund a credit a user lost to a failed AI call (old deduct-first flow).
 *   - Grant a development account a big balance (`--set 9999`).
 *   - Add a fixed amount (`--amount 5`).
 *
 * Safe to re-run: every invocation writes an explicit ledger entry with
 * `restored_via: 'script'` metadata, so duplicates are easy to audit.
 *
 * Examples (PowerShell):
 *   # Top up by 1 credit by Firebase UID
 *   npx tsx backend/scripts/restore-credit.ts --uid abcd1234 --amount 1
 *
 *   # Top up by email (uses firebase-admin Auth to resolve the UID)
 *   npx tsx backend/scripts/restore-credit.ts --email me@example.com --amount 5
 *
 *   # Set the balance to exactly 9999 (useful for dev accounts)
 *   npx tsx backend/scripts/restore-credit.ts --email me@example.com --set 9999
 *
 * Arguments:
 *   --uid     <firebase-uid>      required unless --email is provided
 *   --email   <email-address>     alternative to --uid; resolves UID via Firebase Auth
 *   --amount  <number>            credits to ADD (positive)
 *   --set     <number>            target balance (absolute); overrides --amount
 *   --reason  <LedgerReason>      default "refund_manual" (or "dev_boost" with --set)
 *   --note    <string>            free-form metadata.note field (optional)
 */

import 'dotenv/config';
import { getAdminDb, getAdminAuth } from '../services/firebase.service.js';
import {
  addCreditsWithLedger,
  recordLedgerEntry,
  type LedgerReason
} from '../services/ledger.service.js';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
      out[key] = value;
      if (value !== 'true') i++;
    }
  }
  return out;
}

async function resolveUid(args: Record<string, string>): Promise<string> {
  if (args.uid) return args.uid;
  if (args.email) {
    const auth = getAdminAuth();
    if (!auth) throw new Error('Firebase admin Auth not initialised');
    const rec = await auth.getUserByEmail(args.email);
    console.log(`[restore-credit] Resolved email=${args.email} → uid=${rec.uid}`);
    return rec.uid;
  }
  throw new Error('Must pass either --uid <firebase-uid> or --email <address>');
}

async function setBalance(
  uid: string,
  target: number,
  reason: LedgerReason,
  note?: string
): Promise<void> {
  const db = getAdminDb();
  if (!db) throw new Error('Database not initialised');

  const userRef = db.collection('users').doc(uid);

  // Try to read the current balance so we can compute an accurate delta for the
  // ledger. If the read fails (e.g. Firestore read-quota exhausted while writes
  // are still allowed), fall through to an unconditional write — the WRITE is
  // the thing the user actually needs.
  let current: number | null = null;
  try {
    const snap = await userRef.get();
    if (!snap.exists) throw new Error(`User ${uid} not found`);
    current = Number(snap.data()?.credits ?? 0);
  } catch (readErr: any) {
    console.warn(
      `[restore-credit] Pre-read failed (${readErr?.message?.slice(0, 120) || readErr}); writing target unconditionally.`
    );
  }

  if (current !== null) {
    const delta = target - current;
    console.log(
      `[restore-credit] SET mode: current=${current} → target=${target} (delta=${delta >= 0 ? '+' : ''}${delta})`
    );
    if (delta === 0) {
      console.log('[restore-credit] Balance already matches target; nothing to do.');
      return;
    }
  } else {
    console.log(`[restore-credit] SET mode: writing credits=${target} (previous balance unknown)`);
  }

  // `set` with merge:true is safe whether or not the doc exists and doesn't
  // require a pre-read. `update` would fail if the doc were missing.
  await userRef.set({ credits: target }, { merge: true });

  // Best-effort ledger entry. Skip if this also trips the read quota.
  try {
    await recordLedgerEntry(uid, current === null ? 0 : target - current, reason, {
      restored_via: 'script',
      mode: 'set',
      previous_balance: current,
      target_balance: target,
      ...(note ? { note } : {})
    });
  } catch (logErr: any) {
    console.warn('[restore-credit] Ledger write failed (non-fatal):', logErr?.message || logErr);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const uid = await resolveUid(args);

  const setTarget = args.set !== undefined ? Number(args.set) : undefined;
  const addAmount = args.amount !== undefined ? Number(args.amount) : 1;
  const note = args.note;

  if (setTarget !== undefined) {
    if (!Number.isFinite(setTarget) || setTarget < 0) {
      throw new Error('--set must be a non-negative integer');
    }
    const reason = (args.reason || 'dev_boost') as LedgerReason;
    await setBalance(uid, setTarget, reason, note);
  } else {
    if (!Number.isFinite(addAmount) || addAmount <= 0) {
      throw new Error('--amount must be a positive integer');
    }
    const reason = (args.reason || 'refund_manual') as LedgerReason;
    console.log(
      `[restore-credit] ADD mode: uid=${uid} amount=+${addAmount} reason=${reason}${note ? ` note="${note}"` : ''}`
    );
    await addCreditsWithLedger(uid, addAmount, reason, {
      restored_via: 'script',
      ...(note ? { note } : {})
    });
  }

  console.log(
    '[restore-credit] done. Verify balance in the UI (CreditsProvider onSnapshot will update live).'
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[restore-credit] failed:', err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
