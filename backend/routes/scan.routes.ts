import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createSharedRateLimiter } from '../middleware/ratelimit.middleware.js';
import { getUserScanHistory } from '../services/scan.service.js';
import { getAdminDb } from '../services/firebase.service.js';
import { validate, scanSaveSchema } from '../utils/validation.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

const historyLimiter = createSharedRateLimiter(
  30,
  '1 m',
  'Too many history requests. Please slow down.'
);
const saveLimiter = createSharedRateLimiter(
  20,
  '10 m',
  'Too many save requests. Please slow down.'
);

router.post('/save', saveLimiter, requireAuth, validate(scanSaveSchema), async (req, res) => {
  try {
    const userId = req.user!.uid;
    const { overallScore, analysisData, imageUrl } = req.body;
    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    const docRef = await db.collection('scans').add({
      userId,
      userEmail: req.user!.email || '',
      createdAt: FieldValue.serverTimestamp(),
      overallScore,
      imageUrl: imageUrl || 'base64-stored-in-analysisData',
      analysisData,
      scanType: 'analysis'
    });

    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Scan save error:', error);
    return res.status(500).json({ error: 'Failed to save scan' });
  }
});

// GET /api/scans/history — paginated scan history for authenticated user
router.get('/history', historyLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const { scans, hasMore } = await getUserScanHistory(userId, limit, cursor);

    return res.json({ scans, hasMore });
  } catch (error: any) {
    console.error('Scan history error:', error);
    return res.status(500).json({ error: 'Failed to fetch scan history' });
  }
});

export default router;
