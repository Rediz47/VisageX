// ── Cloudflare Turnstile Server-Side Verification ───────────────────────────
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
//
// Fail-open policy:
//   If Turnstile is unreachable we NO LONGER blindly trust everyone.
//   - Trusted callers (known userId passed in) → allow but log a critical warning.
//   - Unknown/unauthenticated callers → BLOCK (alarm-broken = door stays locked).
//   A circuit-breaker tracks consecutive network failures so we can detect
//   sustained outages vs one-off blips.

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResult {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

// ── Circuit breaker state ──────────────────────────────────────────────────
// Tracks consecutive Turnstile network failures so we can alert on sustained
// outages and tighten the policy automatically.
const CIRCUIT_BREAKER = {
  consecutiveFailures: 0,
  lastFailureAt: 0,
  // After this many consecutive failures we refuse ALL requests (full lockdown).
  MAX_FAILURES_BEFORE_LOCKDOWN: 5,
  // Reset the counter if the last failure was more than 5 minutes ago.
  RESET_WINDOW_MS: 5 * 60 * 1000,
};

function recordTurnstileSuccess() {
  CIRCUIT_BREAKER.consecutiveFailures = 0;
}

function recordTurnstileNetworkFailure() {
  const now = Date.now();
  // Reset counter if the previous failure was long ago (transient blip).
  if (now - CIRCUIT_BREAKER.lastFailureAt > CIRCUIT_BREAKER.RESET_WINDOW_MS) {
    CIRCUIT_BREAKER.consecutiveFailures = 0;
  }
  CIRCUIT_BREAKER.consecutiveFailures++;
  CIRCUIT_BREAKER.lastFailureAt = now;
}

function isCircuitOpen(): boolean {
  return CIRCUIT_BREAKER.consecutiveFailures >= CIRCUIT_BREAKER.MAX_FAILURES_BEFORE_LOCKDOWN;
}

export interface TurnstileOptions {
  /** If the caller is an already-authenticated user, pass their uid.
   *  Trusted users are allowed through on transient Turnstile failures;
   *  unknown callers are always blocked. */
  trustedUserId?: string;
}

/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Returns { success, error? }.
 *
 * If TURNSTILE_SECRET_KEY is not set:
 *   - Production: rejects (security-first)
 *   - Development: allows (so local dev works without Turnstile)
 *
 * On network failure:
 *   - Trusted user + circuit closed → allow (degraded) + warn
 *   - Unknown user OR circuit open  → BLOCK
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string,
  opts?: TurnstileOptions,
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // No secret key configured
  if (!secretKey) {
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
    if (isProd) {
      console.error('[Turnstile] TURNSTILE_SECRET_KEY not set in production — rejecting');
      return { success: false, error: 'CAPTCHA misconfigured' };
    }
    // Dev: skip verification
    return { success: true };
  }

  // No token provided by client
  if (!token) {
    return { success: false, error: 'CAPTCHA token missing' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) formData.append('remoteip', remoteIp);

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const result: TurnstileVerifyResult = await response.json();

    if (!result.success) {
      console.warn('[Turnstile] Verification failed:', result['error-codes']);
      recordTurnstileSuccess(); // network worked, just invalid token
      return {
        success: false,
        error: 'CAPTCHA verification failed',
      };
    }

    recordTurnstileSuccess();
    return { success: true };
  } catch (err) {
    recordTurnstileNetworkFailure();
    const failures = CIRCUIT_BREAKER.consecutiveFailures;
    console.error(`[Turnstile] Network error (consecutive: ${failures}):`, err);

    // Circuit open → full lockdown, nobody gets through
    if (isCircuitOpen()) {
      console.error('[Turnstile] CIRCUIT OPEN — blocking ALL requests until Turnstile recovers');
      return { success: false, error: 'Verification service unavailable. Please try again later.' };
    }

    // Circuit closed but network failed — context-aware degradation
    if (opts?.trustedUserId) {
      // Known authenticated user: allow through but log critical warning
      console.warn(`[Turnstile] DEGRADED: allowing trusted user ${opts.trustedUserId} through (network blip)`);
      return { success: true };
    }

    // Unknown/unauthenticated caller: block (alarm broken = door stays locked)
    return { success: false, error: 'Verification service temporarily unavailable. Please try again.' };
  }
}
