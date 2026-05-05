import { Router } from 'express';
import { randomBytes } from 'crypto';
import { createSharedRateLimiter } from '../middleware/ratelimit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Auth rate limiter: 5 requests per 15 minutes
const authLimiter = createSharedRateLimiter(
  5,
  '15 m',
  'Too many auth requests. Please try again later.'
);

// In-memory "user exists" cache. Once we confirm a user doc exists (either by
// getDoc returning true, or by us just having created it), remember it for the
// lifetime of the process. This turns every repeat call from this user into a
// zero-read no-op — critical while the Firestore free-tier daily quota is tight.
const knownUserIds = new Set<string>();

router.post('/init-user', authLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const isStrictEnv = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

    // Fast path: we've already seen this user in this process — skip Firestore entirely.
    if (knownUserIds.has(userId)) {
      return res.status(200).json({ message: 'User already exists (cached)' });
    }

    let db;
    try {
      db = getAdminDb();
    } catch (dbError: any) {
      console.error('Failed to connect to Firestore during init-user:', dbError);
      if (isStrictEnv) {
        return res.status(500).json({ error: 'Database not initialized' });
      }
      return res.status(200).json({ message: 'User init skipped (dev degraded mode)' });
    }
    if (!db) {
      if (isStrictEnv) {
        return res.status(500).json({ error: 'Database not initialized' });
      }
      return res.status(200).json({ message: 'User init skipped (dev degraded mode)' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const myReferralCode = randomBytes(3).toString('hex').toUpperCase();

      await userRef.set({
        uid: userId,
        email: req.user!.email || null,
        displayName: (req.user as any).name || 'User',
        referredBy: null,
        createdAt: FieldValue.serverTimestamp(),
        role: 'user',
        credits: 0,
        referralCode: myReferralCode,
        invitedCount: 0
      });

      knownUserIds.add(userId);
      console.log(`Backend securely initialized new user: ${userId}`);
      return res.status(201).json({ message: 'User initialized successfully' });
    }

    knownUserIds.add(userId);
    return res.status(200).json({ message: 'User already exists' });
  } catch (error: any) {
    console.error('Error initializing user:', error);
    const isStrictEnv = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (!isStrictEnv) {
      // Don't block the client in dev — Firestore quota/outage shouldn't bring
      // down the auth flow locally. Frontend will retry on next sign-in.
      return res.status(200).json({
        message: 'User init skipped (dev degraded mode)',
        reason: error?.message?.slice(0, 200)
      });
    }
    return res.status(500).json({ error: 'Failed to initialize user securely' });
  }
});

export default router;
