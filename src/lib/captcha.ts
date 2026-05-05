// ── Captcha Token Manager ────────────────────────────────────────────────────
// Stores the latest Turnstile token so API calls can attach it as a header.
// The token is set from the Turnstile widget and consumed by API interceptors.

let _captchaToken: string | null = null;
const _listeners: Set<(token: string | null) => void> = new Set();

export function setCaptchaToken(token: string | null) {
  _captchaToken = token;
  _listeners.forEach((fn) => fn(token));
}

export function getCaptchaToken(): string | null {
  return _captchaToken;
}

/**
 * Subscribe to captcha token changes.
 * Returns an unsubscribe function.
 */
export function onCaptchaTokenChange(fn: (token: string | null) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
