import { Router } from 'express';
import { createSharedRateLimiter } from '../middleware/ratelimit.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Referral rate limiter: 5 redeems/completions per 15 minutes
const referralLimiter = createSharedRateLimiter(5, "15 m", 'Too many referral attempts. Please try again later.');

// Referral Redeem Endpoint (Secure)
router.post('/redeem', referralLimiter, requireAuth, async (req, res) => {
  try {
    const { referralCode, fingerprint } = req.body;
    const userId = req.user!.uid; // Securely get from token

    if (!referralCode) {
      return res.status(400).json({ error: 'Missing referralCode' });
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    const db = getAdminDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const inviterSnapshot = await db.collection('users').where('referralCode', '==', referralCode).limit(1).get();
    if (inviterSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    const inviterDoc = inviterSnapshot.docs[0];
    const inviterId = inviterDoc.id;

    if (inviterId === userId) {
      return res.status(400).json({ error: 'Cannot use your own referral code' });
    }

    await db.runTransaction(async (t) => {
      const newUserRef = db.collection('users').doc(userId);
      const newUserSnap = await t.get(newUserRef);

      if (!newUserSnap.exists) {
        throw new Error('User not found');
      }

      const newUserData = newUserSnap.data();
      if (newUserData?.referredBy) {
        throw new Error('User has already used a referral code');
      }

      const inviterRef = db.collection('users').doc(inviterId);
      const inviterSnap = await t.get(inviterRef);

      // 1. Invitee gets +1 credit
      t.update(newUserRef, {
        referredBy: inviterId,
        credits: FieldValue.increment(1),
        lastIp: clientIp,
        lastFingerprint: fingerprint || '',
        referralRewardTriggered: true
      });

      // 2. Inviter gets +1 invitedCount and tier-based credit bonus
      if (inviterSnap.exists) {
        const inviterData = inviterSnap.data();
        const newInvitedCount = (inviterData?.invitedCount || 0) + 1;

        let creditBonus = 0;
        if (newInvitedCount === 2) creditBonus = 1;
        else if (newInvitedCount === 5) creditBonus = 2;
        else if (newInvitedCount === 10) creditBonus = 3;
        else if (newInvitedCount === 30) creditBonus = 7;
        else if (newInvitedCount === 50) creditBonus = 10;
        else if (newInvitedCount > 10 && newInvitedCount % 5 === 0) creditBonus = 2;

        const inviterCreatedAt = inviterData?.createdAt?.toDate?.();
        if (
          inviterCreatedAt &&
          newInvitedCount === 2 &&
          Date.now() - inviterCreatedAt.getTime() < 48 * 60 * 60 * 1000
        ) {
          creditBonus += 1;
        }

        t.update(inviterRef, {
          invitedCount: newInvitedCount,
          credits: FieldValue.increment(creditBonus)
        });
      }
    });

    return res.status(200).json({ success: true, message: 'Referral applied! You received +1 bonus credit.' });
  } catch (error: any) {
    console.error('Referral redeem error:', error);
    return res.status(400).json({ error: error.message || 'Failed to apply referral code' });
  }
});

// Leaderboard: Top 5 inviters (Public, optional auth for isCurrentUser)
router.get('/leaderboard', async (req, res) => {
  try {
    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    // Optionally verify auth token to securely identify current user
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { getAdminAuth } = await import('../services/firebase.service.js');
        const auth = getAdminAuth();
        if (auth) {
          const decoded = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
          authenticatedUserId = decoded.uid;
        }
      } catch { /* ignore auth errors for public endpoint */ }
    }

    const snap = await db.collection('users')
      .orderBy('invitedCount', 'desc')
      .limit(10)
      .get();

    const entries = snap.docs
      .filter(d => (d.data().invitedCount || 0) > 0)
      .slice(0, 5)
      .map((doc, i) => {
        const data = doc.data();
        const name: string = data.displayName || data.email || 'Anonymous';
        const parts = name.split(/[\s@]/);
        const display = parts[0].charAt(0).toUpperCase() + parts[0].slice(1, 4) + '***';
        return {
          rank: i + 1,
          name: display,
          invites: data.invitedCount || 0,
          isCurrentUser: authenticatedUserId === doc.id,
        };
      });

    return res.json({ leaderboard: entries });
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

// Scan Completion Endpoint: Trigger referral rewards for the inviter
router.post('/scan/complete', referralLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;

    const db = getAdminDb();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    const inviterId = userDoc.data()?.referredBy;
    if (!inviterId) return res.json({ success: true, message: 'No referral found' });

    // Mark current user as having completed a scan
    await db.collection('users').doc(userId).update({
      referralRewardTriggered: true
    });

    console.log(`Scan completion recorded for user ${userId}. Inviter: ${inviterId}`);
    return res.json({ success: true, message: 'Scan completion reward triggered' });
  } catch (error: any) {
    console.error('Scan complete error:', error);
    return res.status(500).json({ error: 'Failed to process scan completion' });
  }
});

export default router;
