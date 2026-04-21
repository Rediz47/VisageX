import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createSharedRateLimiter } from '../middleware/ratelimit.middleware.js';
import { getUserScanHistory } from '../services/scan.service.js';

const router = Router();

const historyLimiter = createSharedRateLimiter(30, "1 m", 'Too many history requests. Please slow down.');

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
