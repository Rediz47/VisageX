import { getAdminAuth } from '../services/firebase.service.js';
import { Request, Response, NextFunction } from 'express';

// Extend the Express Request interface to include the user property
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    console.error('Firebase Auth Verification Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
