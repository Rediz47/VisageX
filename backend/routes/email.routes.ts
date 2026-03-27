import { Router } from 'express';
import { getResend } from '../services/email.service.js';
import { getAdminDb } from '../services/firebase.service.js';

const router = Router();

// Welcome Email Endpoint
router.post('/welcome', async (req, res) => {
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
          <h2>Welcome to Visage AI, ${name || 'there'}!</h2>
          <p>We're thrilled to have you on board. Your journey to unlocking your true facial potential starts now.</p>
          <p>You have <strong>1 free credit</strong> to run your first clinical facial analysis.</p>
          <p>Log in to <a href="${process.env.APP_URL || '#'}">Visage AI</a> to get started.</p>
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
