import { Router } from 'express';
import { getAdminDb } from '../services/firebase.service.js';
import { PLANS, getPlanCredits } from '../services/plans.service.js';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

const router = Router();

function getPaddleApiBaseUrl() {
  const environment = process.env.PADDLE_ENV || process.env.VITE_PADDLE_ENV || 'sandbox';
  return environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
}

async function fetchPaddleTransaction(transactionId: string) {
  const apiKey = process.env.PADDLE_API_KEY || process.env.PADDLE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('Missing PADDLE_API_KEY for Paddle transaction verification');
  }

  const response = await fetch(
    `${getPaddleApiBaseUrl()}/transactions/${encodeURIComponent(transactionId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paddle transaction lookup failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<{ data?: any }>;
}

// Reusable Credit Grant Transaction (identical to your PayPal ledger)
async function grantCreditsForProcessedOrder(
  orderId: string,
  userId: string,
  planId: string,
  source: 'paddle'
) {
  const db = getAdminDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const credits = getPlanCredits(planId);
  const orderRef = db.collection('processed_orders').doc(orderId);
  const userRef = db.collection('users').doc(userId);
  const ledgerRef = db.collection('credits_ledger').doc();
  const processedAt = new Date().toISOString();

  const result = await db.runTransaction(async (transaction) => {
    const [orderDoc, userDoc] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(userRef)
    ]);

    if (orderDoc.exists) {
      return {
        applied: false,
        existingUserId: orderDoc.data()?.userId || null
      };
    }

    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found for processed order ${orderId}`);
    }

    transaction.update(userRef, { credits: FieldValue.increment(credits) });
    transaction.set(ledgerRef, {
      userId,
      change: credits,
      reason: 'purchase',
      metadata: {
        orderId,
        planId,
        source
      },
      timestamp: FieldValue.serverTimestamp()
    });
    transaction.set(orderRef, {
      processedAt,
      planId,
      userId,
      source
    });

    return {
      applied: true,
      existingUserId: null
    };
  });

  return { ...result, credits };
}

router.post('/debug-grant-credits', async (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
    return res.status(404).send('Not found');
  }

  const { userId, planId } = req.body || {};
  if (!userId || !planId || !PLANS[planId]) {
    return res.status(400).json({ error: 'Valid userId and planId are required' });
  }

  try {
    const orderId = `debug_paddle_${Date.now()}_${crypto.randomUUID()}`;
    const result = await grantCreditsForProcessedOrder(orderId, userId, planId, 'paddle');
    return res.json({ ok: true, orderId, ...result });
  } catch (err: any) {
    console.error('Paddle debug credit grant failed:', err);
    return res.status(500).json({ error: err?.message || 'Debug credit grant failed' });
  }
});

router.post('/claim-transaction', async (req, res) => {
  const { transactionId } = req.body || {};
  if (!transactionId || typeof transactionId !== 'string') {
    return res.status(400).json({ error: 'transactionId is required' });
  }

  try {
    const transaction = await fetchPaddleTransaction(transactionId);
    const data = transaction.data;
    const status = data?.status;
    const customData = data?.custom_data || {};
    const userId = customData.userId;
    const planId = customData.planId;

    if (!['completed', 'paid'].includes(status)) {
      return res
        .status(409)
        .json({ error: `Transaction is not completed yet: ${status || 'unknown'}` });
    }

    if (!userId || !planId || !PLANS[planId]) {
      return res
        .status(400)
        .json({ error: 'Paddle transaction is missing valid purchase metadata' });
    }

    const result = await grantCreditsForProcessedOrder(transactionId, userId, planId, 'paddle');
    return res.json({ ok: true, transactionId, planId, userId, ...result });
  } catch (err: any) {
    console.error('Paddle transaction claim failed:', err);
    return res.status(500).json({ error: err?.message || 'Unable to claim Paddle transaction' });
  }
});

// 🔒 Webhook Verification Middleware
function verifyPaddleSignature(req: any, res: any, next: any) {
  const signature = req.headers['paddle-signature'] as string;
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;

  // In development, if secret is not set, allow skipping verification for easy local testing
  if (!webhookSecret) {
    if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
      console.warn('⚠️ PADDLE_WEBHOOK_SECRET not set in DEV — skipping webhook signature check');
      return next();
    }
    console.error('CRITICAL: PADDLE_WEBHOOK_SECRET is not configured in production');
    return res.status(401).send('Webhook misconfigured');
  }

  if (!signature) {
    return res.status(401).send('Missing paddle-signature header');
  }

  try {
    const parts = signature.split(';');
    const tsPart = parts.find((p) => p.startsWith('ts=') || p.startsWith('t='));
    const hPart = parts.find((p) => p.startsWith('h1=') || p.startsWith('h='));

    const ts = tsPart ? tsPart.slice(tsPart.indexOf('=') + 1) : null;
    const h = hPart ? hPart.slice(hPart.indexOf('=') + 1) : null;

    if (!ts || !h) {
      return res.status(400).send('Malformed paddle-signature header');
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const payload = `${ts}:${rawBody}`;
    const computedHash = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    const computed = Buffer.from(computedHash, 'hex');
    const received = Buffer.from(h, 'hex');

    if (computed.length !== received.length || !crypto.timingSafeEqual(computed, received)) {
      console.error('Paddle Webhook Signature verification FAILED');
      return res.status(403).send('Invalid webhook signature');
    }

    next();
  } catch (err: any) {
    console.error('Error verifying Paddle signature:', err);
    return res.status(403).send('Webhook verification failed');
  }
}

// Paddle Webhook Endpoint
router.post('/webhook', verifyPaddleSignature, async (req, res) => {
  try {
    const { event_type, data } = req.body;
    console.log('Paddle Webhook received:', event_type);

    if (event_type === 'transaction.completed') {
      const transactionId = data.id;
      // Paddle places checkout custom data under data.custom_data
      const customData = data.custom_data;

      const userId = customData?.userId;
      const planId = customData?.planId;

      console.log(
        `Paddle Transaction Details: ID=${transactionId}, User=${userId}, Plan=${planId}`
      );

      if (transactionId && userId && planId) {
        if (!PLANS[planId]) {
          console.error(`Invalid planId received in Paddle webhook: ${planId}`);
          return res.status(400).send('Invalid plan ID');
        }

        const { applied, credits } = await grantCreditsForProcessedOrder(
          transactionId,
          userId,
          planId,
          'paddle'
        );

        if (applied) {
          console.log(`Paddle Webhook SUCCESS: Granted ${credits} credits to user ${userId}`);
        } else {
          console.log(`Paddle Webhook: Transaction ${transactionId} was already processed.`);
        }
      } else {
        console.warn('Paddle Webhook transaction.completed was missing custom metadata', {
          transactionId,
          userId,
          planId
        });
      }
    }

    return res.status(200).send('OK');
  } catch (err: any) {
    console.error('Paddle Webhook Error:', err);
    return res.status(500).send('Webhook Error');
  }
});

export default router;
