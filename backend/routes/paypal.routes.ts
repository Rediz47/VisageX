import { Router } from 'express';
import { createSharedRateLimiter, getRedis } from '../middleware/ratelimit.middleware.js';
import { getPayPalAccessToken, PAYPAL_API } from '../services/paypal.service.js';
import { PLANS, getPlanCredits, getPlanPrice, getPlanName } from '../services/plans.service.js';
import { getAdminDb } from '../services/firebase.service.js';
import { getResend } from '../services/email.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { FieldValue } from 'firebase-admin/firestore';
import {
  validate,
  paypalCreateOrderSchema,
  paypalCaptureOrderSchema
} from '../utils/validation.js';
import { addCreditsWithLedger } from '../services/ledger.service.js';

const router = Router();

// PayPal Create Order (Secure)
const orderLimiter = createSharedRateLimiter(
  10,
  '10 m',
  'Too many order requests. Please slow down.'
);

router.post(
  '/create-order',
  orderLimiter,
  requireAuth,
  validate(paypalCreateOrderSchema),
  async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user!.uid;

      // Reject unknown plan IDs
      if (!PLANS[planId]) {
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      const accessToken = await getPayPalAccessToken();

      const price = getPlanPrice(planId);
      const name = getPlanName(planId);

      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          application_context: {
            shipping_preference: 'NO_SHIPPING'
          },
          purchase_units: [
            {
              amount: {
                currency_code: 'USD',
                value: price
              },
              description: name,
              custom_id: JSON.stringify({ userId, planId })
            }
          ]
        })
      });

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error('PayPal Order Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
);

// PayPal Capture Order (Secure)
router.post('/capture-order', requireAuth, validate(paypalCaptureOrderSchema), async (req, res) => {
  try {
    const { orderID } = req.body;
    const authenticatedUserId = req.user!.uid;
    let planId: string | undefined;

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (data.status === 'COMPLETED' || data.status === 'PENDING' || data.status === 'APPROVED') {
      const purchaseUnit = data.purchase_units?.[0] || {};
      const customIdRaw =
        purchaseUnit.custom_id ||
        purchaseUnit.payments?.captures?.[0]?.custom_id ||
        data.purchase_units?.[0]?.custom_id;

      console.log(`PayPal Capture Status: ${data.status}`);
      console.log('Order ID:', orderID);

      if (customIdRaw) {
        try {
          const parsed = JSON.parse(customIdRaw);
          if (parsed.planId) planId = parsed.planId;
        } catch (e) {
          console.error('Failed to parse custom_id', e);
          return res.status(400).json({ error: 'Invalid order metadata' });
        }
      }

      if (!planId) {
        console.error('Missing planId in capture response and fallback');
        return res.status(400).json({ error: 'Invalid order metadata' });
      }
      if (!PLANS[planId]) {
        console.error('Invalid planId in capture response');
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      const credits = getPlanCredits(planId);

      const db = getAdminDb();
      if (db) {
        const orderRef = db.collection('processed_orders').doc(orderID);
        const orderDoc = await orderRef.get();

        if (!orderDoc.exists) {
          await addCreditsWithLedger(authenticatedUserId, credits, 'purchase', {
            orderId: orderID,
            planId,
            source: 'capture'
          });
          await orderRef.set({
            processedAt: new Date().toISOString(),
            planId,
            userId: authenticatedUserId,
            source: 'capture'
          });
          console.log(
            `Server-side credit update: User ${authenticatedUserId} gets ${credits} credits.`
          );
        } else {
          console.log(`Order ${orderID} already processed.`);
        }
      }
    }

    return res.json(data);
  } catch (error: any) {
    console.error('PayPal Capture Error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PayPal Webhook (Public — signature verified + replay protection)
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('PayPal Webhook received:', event.event_type);

    // Replay attack protection: reject duplicate event IDs
    const eventId = event.id;
    if (eventId) {
      const redis = getRedis();
      if (redis) {
        const alreadyProcessed = await redis.get(`webhook:${eventId}`);
        if (alreadyProcessed) {
          console.log(`Webhook replay blocked: ${eventId}`);
          return res.status(200).send('OK (duplicate)');
        }
        // Mark as processed with 72h TTL
        await redis.set(`webhook:${eventId}`, '1', { ex: 259200 });
      }
    }

    // Verify webhook signature to prevent spoofed events
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (webhookId) {
      try {
        const accessToken = await getPayPalAccessToken();
        const verifyResponse = await fetch(
          `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              auth_algo: req.headers['paypal-auth-algo'],
              cert_url: req.headers['paypal-cert-url'],
              transmission_id: req.headers['paypal-transmission-id'],
              transmission_sig: req.headers['paypal-transmission-sig'],
              transmission_time: req.headers['paypal-transmission-time'],
              webhook_id: webhookId,
              webhook_event: event
            })
          }
        );
        const verifyData = await verifyResponse.json();
        if (verifyData.verification_status !== 'SUCCESS') {
          console.error('PayPal webhook signature verification FAILED');
          return res.status(403).send('Invalid webhook signature');
        }
      } catch (verifyErr) {
        console.error('PayPal webhook verification error:', verifyErr);
        return res.status(403).send('Webhook verification failed');
      }
    } else {
      if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
        console.error('PAYPAL_WEBHOOK_ID not set in production — rejecting webhook');
        return res.status(403).send('Webhook misconfigured');
      }
      console.warn('PAYPAL_WEBHOOK_ID not set — skipping signature verification (DEV ONLY)');
    }

    if (
      event.event_type === 'CHECKOUT.ORDER.APPROVED' ||
      event.event_type === 'PAYMENT.CAPTURE.COMPLETED'
    ) {
      const resource = event.resource;
      const customIdRaw = resource.custom_id || resource.purchase_units?.[0]?.custom_id;

      let userId, planId;
      if (customIdRaw) {
        try {
          const parsed = JSON.parse(customIdRaw);
          userId = parsed.userId;
          planId = parsed.planId;
        } catch (e) {
          console.error('Failed to parse custom_id from webhook', e);
        }
      }

      if (userId && planId) {
        const credits = getPlanCredits(planId);
        const db = getAdminDb();
        if (db) {
          const orderId = resource.id;
          const orderRef = db.collection('processed_orders').doc(orderId);
          const orderDoc = await orderRef.get();

          if (!orderDoc.exists) {
            await addCreditsWithLedger(userId, credits, 'purchase', {
              orderId,
              planId,
              source: 'webhook'
            });
            await orderRef.set({
              processedAt: new Date().toISOString(),
              planId,
              userId,
              source: 'webhook'
            });
            console.log(`Webhook: Added ${credits} credits to user ${userId}`);

            try {
              const userDocSnap = await db.collection('users').doc(userId).get();
              if (userDocSnap.exists) {
                const userData = userDocSnap.data();
                if (userData?.email) {
                  const resend = getResend();
                  await resend.emails.send({
                    from: 'Visage AI <receipts@resend.dev>',
                    to: userData.email,
                    subject: 'Receipt for Visage AI Credits',
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Thank you for your purchase!</h2>
                        <p>We've successfully added <strong>${credits} credits</strong> to your account.</p>
                        <p>You can now run more aesthetic facial analyses.</p>
                        <p>Log in to <a href="${process.env.APP_URL}">Visage AI</a> to continue.</p>
                      </div>
                    `
                  });
                  console.log(`Receipt email sent to ${userData.email}`);
                }
              }
            } catch (emailErr) {
              console.error('Failed to send receipt email:', emailErr);
            }
          } else {
            console.log(`Webhook: Order ${orderId} already processed.`);
          }
        }
      }
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('PayPal Webhook Error:', error);
    return res.status(500).send('Webhook Error');
  }
});

export default router;
