export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Determine PayPal API environment. 
// Defaults to Sandbox in development, Live in production.
export const isLive = process.env.PAYPAL_ENVIRONMENT === 'live' ||
  (!process.env.PAYPAL_ENVIRONMENT && process.env.NODE_ENV === 'production');
export const PAYPAL_API = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const data = await response.json();
  return data.access_token;
}
