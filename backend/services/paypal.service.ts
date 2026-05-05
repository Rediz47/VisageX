export const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
export const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

export const isLive = true;
export const PAYPAL_API = 'https://api-m.paypal.com';

// Token cache — PayPal tokens are valid for ~9 hours, we refresh at 8h to be safe
let cachedToken: string | null = null;
let tokenExpiresAt = 0;
const TOKEN_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export async function getPayPalAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const data = await response.json();

  // Cache the token with expiry (PayPal returns expires_in in seconds, default ~32400s / 9h)
  cachedToken = data.access_token;
  const expiresInMs = (data.expires_in || 28800) * 1000; // Fallback 8h if missing
  tokenExpiresAt = Date.now() + expiresInMs - TOKEN_BUFFER_MS;

  return cachedToken;
}
