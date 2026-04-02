import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getResend } from '../services/email.service.js';
import { getAdminDb } from '../services/firebase.service.js';

const router = Router();

// Email rate limiter: 3 emails per 10 minutes
const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Please wait before requesting another email.', code: 'RATE_LIMITED' },
  skip: (req) => req.method === 'OPTIONS',
});

// Welcome Email Endpoint
router.post('/welcome', emailLimiter, async (req, res) => {
  try {
    const { email, name, userId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    if (userId && clientIp !== 'unknown') {
      const db = getAdminDb();
      if (db) {
        await db.collection('users').doc(userId).update({ lastIp: clientIp }).catch(console.error);
      }
    }

    const resend = getResend();
    await resend.emails.send({
      from: 'Visage AI <onboarding@resend.dev>', // Replace with your verified domain
      to: email,
      subject: 'Welcome to Visage AI',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Welcome to VisageX, ${name || 'there'}!</h2>
          <p>We're thrilled to have you on board. Your journey to unlocking your true facial potential starts now.</p>
          <p>Upload a selfie to get your <strong>free facial analysis preview</strong> — then unlock the full report to see your complete breakdown.</p>
          <p>Log in to <a href="${process.env.APP_URL || '#'}">VisageX</a> to get started.</p>
        </div>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

export default router;
