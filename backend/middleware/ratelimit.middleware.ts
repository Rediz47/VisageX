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
  console.warn("Upstash Redis not configured. Rate limiting disabled fallback.");
}

export const createSharedRateLimiter = (maxRequests: number, windowStr: any, errorMessage: string) => {
  const ratelimit = redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, windowStr),
    analytics: false,
  }) : null;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next();
    if (!ratelimit) return next(); // Fallback open if no redis configured

    // Identify user by IP or header
    let identifier = req.ip || req.headers['x-forwarded-for'];
    if (Array.isArray(identifier)) identifier = identifier[0];
    if (!identifier) identifier = 'anonymous';

    try {
      // Add a 2-second timeout to the rate limit check
      const timeoutPromise = new Promise<{ success: boolean; limit: number; remaining: number; reset: number }>(
        (_, reject) => setTimeout(() => reject(new Error('Rate limit check timed out')), 2000)
      );

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
      next();
    } catch (e: any) {
      console.error("Rate limit error or timeout:", e.message || e);
      // Failsafe: if Redis is slow or down, we allow the request to proceed
      next();
    }
  };
};
