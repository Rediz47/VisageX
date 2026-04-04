import { Router } from 'express';
import { createSharedRateLimiter } from '../middleware/ratelimit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Auth rate limiter: 5 requests per 15 minutes
const authLimiter = createSharedRateLimiter(5, "15 m", 'Too many auth requests. Please try again later.');

router.post('/init-user', authLimiter, requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;
    const db = getAdminDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const myReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
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
      
      console.log(`Backend securely initialized new user: ${userId}`);
      return res.status(201).json({ message: 'User initialized successfully' });
    }

    return res.status(200).json({ message: 'User already exists' });
  } catch (error: any) {
    console.error('Error initializing user:', error);
    return res.status(500).json({ error: 'Failed to initialize user securely' });
  }
});

export default router;
