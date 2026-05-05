import { getAdminDb } from './firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'crypto';

// ── Scan Result Storage ─────────────────────────────────────────────────────
// Stores AI analysis results in Firestore for:
// - User history (re-open past scans)
// - Result caching (same image → cached result)
// - Analytics (track improvement over time)

export interface StoredScan {
  userId: string;
  imageHash: string; // SHA-256 of the compressed image data
  scanType: 'analysis' | 'celebrity' | 'hair';
  result: Record<string, any>;
  overallScore?: number;
  createdAt: any;
}

/**
 * Generates a SHA-256 hash of image data for deduplication/caching.
 */
export function hashImage(base64Data: string): string {
  return createHash('sha256').update(base64Data).digest('hex');
}

/**
 * Checks if we have a cached result for the same image (same user + same hash).
 * Returns the cached result or null.
 */
export async function getCachedResult(
  userId: string,
  imageHash: string,
  scanType: 'analysis' | 'celebrity' | 'hair'
): Promise<Record<string, any> | null> {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const cached = await db
      .collection('scans')
      .where('userId', '==', userId)
      .where('imageHash', '==', imageHash)
      .where('scanType', '==', scanType)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!cached.empty) {
      const doc = cached.docs[0];
      const data = doc.data();
      console.log(`[Cache] HIT — returning cached ${scanType} result for user ${userId}`);
      return { ...data.result, _cached: true, _scanId: doc.id };
    }

    return null;
  } catch (err) {
    // Cache miss is fine — just log and continue
    console.warn('[Cache] Lookup failed:', (err as Error).message);
    return null;
  }
}

/**
 * Stores a scan result in Firestore.
 * Returns the document ID.
 */
export async function storeScanResult(
  userId: string,
  imageHash: string,
  scanType: 'analysis' | 'celebrity' | 'hair',
  result: Record<string, any>
): Promise<string | null> {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const doc: StoredScan = {
      userId,
      imageHash,
      scanType,
      result,
      overallScore: result.overall_aesthetics_score || result.overallScore || undefined,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('scans').add(doc);
    console.log(`[Scan] Stored ${scanType} result: ${docRef.id}`);
    return docRef.id;
  } catch (err) {
    console.error('[Scan] Failed to store result:', err);
    return null;
  }
}

/**
 * Gets scan history for a user (paginated).
 */
export async function getUserScanHistory(
  userId: string,
  limit: number = 20,
  startAfterTimestamp?: string
): Promise<{ scans: any[]; hasMore: boolean }> {
  const db = getAdminDb();
  if (!db) return { scans: [], hasMore: false };

  try {
    let query = db
      .collection('scans')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit + 1); // +1 to detect "hasMore"

    if (startAfterTimestamp) {
      query = query.startAfter(new Date(startAfterTimestamp));
    }

    const snap = await query.get();
    const scans = snap.docs.slice(0, limit).map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));

    return {
      scans,
      hasMore: snap.size > limit
    };
  } catch (err) {
    console.error('[Scan] History fetch failed:', err);
    return { scans: [], hasMore: false };
  }
}
