import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import { getAdminEmails } from '../utils/config.js';
import { purgeOldActivityLogs } from '../services/fraud.service.js';

const router = Router();

// Admin emails loaded from ADMIN_EMAILS env var (comma-separated)
const ADMIN_EMAILS = getAdminEmails().map((email) => email.toLowerCase());
const adminCache = new Map<string, { allowed: boolean; expiresAt: number }>();

/** Middleware: only allow admin emails (verified from Firebase Auth token) */
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email?.toLowerCase();
    if (!uid || !email || !ADMIN_EMAILS.includes(email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const cached = adminCache.get(uid);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.allowed ? next() : res.status(403).json({ error: 'Admin access required' });
    }

    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    const userDoc = await db.collection('users').doc(uid).get();
    const allowed = userDoc.exists && userDoc.data()?.role === 'admin';
    adminCache.set(uid, { allowed, expiresAt: Date.now() + 60_000 });

    if (!allowed) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ error: 'Failed to verify admin access' });
  }
}

// GET /api/admin/analytics — usage + revenue + growth metrics
router.get('/analytics', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database not available' });

    // 1. Total users
    const usersSnap = await db.collection('users').count().get();
    const totalUsers = usersSnap.data().count;

    // 2. Users created in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersSnap = await db
      .collection('users')
      .where('createdAt', '>=', weekAgo)
      .count()
      .get();
    const newUsersLast7d = newUsersSnap.data().count;

    // 3. Total scans
    const scansSnap = await db.collection('scans').count().get();
    const totalScans = scansSnap.data().count;

    // 4. Scans in last 7 days
    const recentScansSnap = await db
      .collection('scans')
      .where('createdAt', '>=', weekAgo.toISOString())
      .count()
      .get();
    const scansLast7d = recentScansSnap.data().count;

    // 5. Total orders (revenue events)
    const ordersSnap = await db.collection('processed_orders').count().get();
    const totalOrders = ordersSnap.data().count;

    // 6. Orders in last 7 days
    const recentOrdersSnap = await db
      .collection('processed_orders')
      .where('processedAt', '>=', weekAgo.toISOString())
      .count()
      .get();
    const ordersLast7d = recentOrdersSnap.data().count;

    // 7. Total credits in circulation
    const top50 = await db.collection('users').orderBy('credits', 'desc').limit(50).get();
    let totalCreditsInCirculation = 0;
    top50.forEach((doc) => {
      totalCreditsInCirculation += doc.data().credits || 0;
    });

    // 8. Referral stats
    const topReferrers = await db
      .collection('users')
      .orderBy('invitedCount', 'desc')
      .limit(5)
      .get();
    const referralLeaders = topReferrers.docs
      .filter((d) => (d.data().invitedCount || 0) > 0)
      .map((d) => ({
        email: d.data().email || 'anon',
        invitedCount: d.data().invitedCount || 0
      }));

    return res.json({
      timestamp: new Date().toISOString(),
      users: { total: totalUsers, last7d: newUsersLast7d },
      scans: { total: totalScans, last7d: scansLast7d },
      orders: { total: totalOrders, last7d: ordersLast7d },
      credits: { inCirculation: totalCreditsInCirculation },
      referrals: { topReferrers: referralLeaders }
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/admin/purge-logs — delete activity_log entries older than N days
router.post('/purge-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const retentionDays = Math.max(1, Math.min(365, Number(req.body?.retentionDays) || 30));
    const deleted = await purgeOldActivityLogs(retentionDays);
    return res.json({ deleted, retentionDays });
  } catch (error: any) {
    console.error('Admin purge-logs error:', error);
    return res.status(500).json({ error: 'Failed to purge logs' });
  }
});

export default router;
