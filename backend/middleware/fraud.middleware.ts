import { Request, Response, NextFunction } from 'express';
import {
  trackActivity,
  getUserRiskStatus,
  generateDeviceFingerprint
} from '../services/fraud.service.js';
import { verifyTurnstileToken } from '../utils/turnstile.js';

// Preemptive block threshold for expensive operations (AI analysis, celebrity scan).
// Set stricter than full ban (90) so we stop burning money on abusive accounts
// before the ban escalation catches up.
const RISK_SCORE_BLOCK_EXPENSIVE = Number(process.env.FRAUD_RISK_BLOCK_EXPENSIVE) || 70;

export interface FraudCheckOptions {
  /** If true, block at riskScore >= RISK_SCORE_BLOCK_EXPENSIVE (70) before the full ban threshold. */
  strict?: boolean;
}

/**
 * Fraud check middleware — runs on protected endpoints.
 * Tracks activity + checks if user is banned/soft-banned.
 * Verifies Cloudflare Turnstile CAPTCHA when required.
 * Must be placed AFTER requireAuth (needs req.user).
 *
 * Pass `{ strict: true }` for expensive endpoints (AI analysis) to also enforce
 * a preemptive block at riskScore >= 70, avoiding the need for a separate
 * `isHighRiskForExpensiveOp` call in the route (which would duplicate the
 * cache lookup performed here).
 */
export function fraudCheck(action: string, options: FraudCheckOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.uid;
    if (!userId) return next(); // No auth = skip (other middleware handles this)

    let ip = req.ip || req.headers['x-forwarded-for'];
    if (Array.isArray(ip)) ip = ip[0];
    if (!ip) ip = 'unknown';

    // Accept optional client-side fingerprint (e.g. from FingerprintJS) for stronger anchoring
    const clientFp =
      (req.headers['x-device-fingerprint'] as string) || req.body?._deviceFingerprint;
    const deviceFingerprint = generateDeviceFingerprint(req.headers, clientFp);

    // Attach metadata to request for downstream use
    (req as any)._fraud = { ip, deviceFingerprint };

    try {
      // Check existing risk status (fast path, hits in-memory cache when warm)
      const riskStatus = await getUserRiskStatus(userId);

      if (!riskStatus.allowed) {
        return res.status(403).json({
          error: 'Account suspended due to policy violation',
          code: 'ACCOUNT_SUSPENDED'
        });
      }

      // Preemptive block for expensive ops — reuses the profile already fetched
      // above (cache hit), saving a second Firestore read that isHighRiskForExpensiveOp
      // would otherwise perform on cache miss.
      if (options.strict && riskStatus.riskScore >= RISK_SCORE_BLOCK_EXPENSIVE) {
        console.warn(
          `[Fraud] Preemptive block: user ${userId} has riskScore ${riskStatus.riskScore} (threshold: ${RISK_SCORE_BLOCK_EXPENSIVE})`
        );
        return res.status(403).json({
          error: 'Your account has been flagged for unusual activity. Please contact support.',
          code: 'HIGH_RISK_BLOCKED'
        });
      }

      if (riskStatus.requiresCaptcha) {
        // Check if request includes captcha token
        const captchaToken = (req.headers['x-captcha-token'] as string) || req.body?._captchaToken;
        if (!captchaToken) {
          return res.status(403).json({
            error: 'Verification required',
            code: 'CAPTCHA_REQUIRED',
            requiresCaptcha: true
          });
        }

        // Verify with Cloudflare Turnstile (pass userId so trusted users degrade gracefully)
        const { success, error } = await verifyTurnstileToken(captchaToken, ip, {
          trustedUserId: userId
        });
        if (!success) {
          return res.status(403).json({
            error: error || 'CAPTCHA verification failed',
            code: 'CAPTCHA_FAILED'
          });
        }
      }

      // Track activity (async, non-blocking for response)
      trackActivity(userId, ip, deviceFingerprint, action).catch(() => {});

      next();
    } catch (err) {
      // Fraud system errors should never block legitimate users
      console.error('[FraudMiddleware] Error:', err);
      next();
    }
  };
}

/**
 * Standalone Turnstile verification middleware.
 * Use on endpoints that ALWAYS require CAPTCHA (e.g. signup).
 * Reads token from x-captcha-token header or body._captchaToken.
 */
export function requireTurnstile() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers['x-captcha-token'] as string) || req.body?._captchaToken;

    let ip = req.ip || req.headers['x-forwarded-for'];
    if (Array.isArray(ip)) ip = ip[0];

    // Pass userId if available so trusted users degrade gracefully on Turnstile outage
    const trustedUserId = req.user?.uid;
    const { success, error } = await verifyTurnstileToken(token, ip || undefined, {
      trustedUserId
    });
    if (!success) {
      return res.status(403).json({
        error: error || 'CAPTCHA verification failed',
        code: 'CAPTCHA_FAILED'
      });
    }

    next();
  };
}
