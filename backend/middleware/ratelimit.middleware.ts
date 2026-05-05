import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis safely
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (e) {
  console.warn('Upstash Redis not configured. Rate limiting disabled fallback.');
}

export function getRedis(): Redis | null {
  return redis;
}

/**
 * Creates a rate limiter that combines IP + userId for identification.
 * This prevents both:
 * - Single user spamming from one IP
 * - Single user rotating IPs to bypass limits
 */
export const createSharedRateLimiter = (
  maxRequests: number,
  windowStr: any,
  errorMessage: string
) => {
  const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, windowStr),
        analytics: false
      })
    : null;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next();
    if (!ratelimit) return next(); // Fallback open if no redis configured
    // Skip rate limiting entirely in dev so local testing isn't blocked by the 5 req / 10 min caps.
    if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) return next();

    // Build composite identifier: prefer userId (from auth), fallback to IP
    const userId = req.user?.uid;
    let ip = req.ip || req.headers['x-forwarded-for'];
    if (Array.isArray(ip)) ip = ip[0];
    if (!ip) ip = 'anonymous';

    // Use userId if available (rate limit per account), otherwise IP
    const identifier = userId ? `user:${userId}` : `ip:${ip}`;

    try {
      // Add a 2-second timeout to the rate limit check
      const timeoutPromise = new Promise<{
        success: boolean;
        limit: number;
        remaining: number;
        reset: number;
      }>((_, reject) => setTimeout(() => reject(new Error('Rate limit check timed out')), 2000));

      const { success, limit, remaining, reset } = await Promise.race([
        ratelimit.limit(identifier),
        timeoutPromise
      ]);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', reset);

      if (!success) {
        res.status(429).json({ error: errorMessage, code: 'RATE_LIMITED' });
        return;
      }

      // If user is authenticated, also check per-IP to prevent IP rotation abuse
      if (userId) {
        const ipResult = await Promise.race([ratelimit.limit(`ip:${ip}`), timeoutPromise]);
        if (!ipResult.success) {
          res.status(429).json({ error: errorMessage, code: 'RATE_LIMITED' });
          return;
        }
      }

      next();
    } catch (e: any) {
      console.error('Rate limit error or timeout:', e.message || e);
      // Failsafe: if Redis is slow or down, we allow the request to proceed
      next();
    }
  };
};

/**
 * Daily usage cap per user. Separate from sliding window rate limits.
 * Resets at midnight UTC. Stored in Redis with TTL.
 */
export const createDailyCap = (maxPerDay: number, errorMessage: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next();
    if (!redis) return next();
    if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) return next();

    const userId = req.user?.uid;
    if (!userId) return next(); // Only applies to authenticated users

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `daily:${userId}:${today}`;

    try {
      const current = await redis.incr(key);

      // Set TTL on first use (expires at end of day + buffer)
      if (current === 1) {
        await redis.expire(key, 86400 + 3600); // 25 hours
      }

      if (current > maxPerDay) {
        return res.status(429).json({
          error: errorMessage,
          code: 'DAILY_LIMIT_REACHED',
          resetAt: `${today}T23:59:59Z`
        });
      }

      res.setHeader('X-Daily-Remaining', Math.max(0, maxPerDay - current));
      next();
    } catch (e: any) {
      console.error('Daily cap check error:', e.message || e);
      next(); // Failsafe open
    }
  };
};
