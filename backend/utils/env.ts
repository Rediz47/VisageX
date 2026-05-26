import { z } from 'zod';

/**
 * Production Environment Variable Validator
 *
 * This module validates all required environment variables on startup.
 * If any critical variables are missing, the application will fail fast
 * with a clear error message instead of failing silently at runtime.
 *
 * Usage:
 * ```typescript
 * import { validateEnv, env } from './utils/env.js';
 *
 * // Call this early in your app startup
 * validateEnv();
 *
 * // Use validated env vars
 * const apiKey = env.VERTEX_API_KEY;
 * ```
 */

// Schema for server-side environment variables (never exposed to frontend)
const serverEnvSchema = z.object({
  // Required for production
  VERTEX_API_KEY: z.string().min(1, 'VERTEX_API_KEY is required for Gemini AI'),
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT is required'),
  FIRESTORE_DATABASE_ID: z.string().min(1, 'FIRESTORE_DATABASE_ID is required'),

  // Required for payments (if using Paddle)
  PADDLE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Required for rate limiting
  // Tolerate malformed/placeholder values in dev — feature flagged via hasRateLimiting()
  UPSTASH_REDIS_REST_URL: z
    .string()
    .optional()
    .refine((v) => !v || /^https?:\/\//.test(v), {
      message: 'UPSTASH_REDIS_REST_URL must be a valid URL when set'
    }),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Required for email (if using Resend)
  RESEND_API_KEY: z.string().min(1).optional(),

  // Required for CAPTCHA
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),

  // App configuration
  // Tolerate http://localhost during dev; falls back to default if missing
  APP_URL: z
    .string()
    .default('https://visagex.online')
    .refine((v) => /^https?:\/\//.test(v), {
      message: 'APP_URL must start with http:// or https://'
    }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Admin configuration
  ADMIN_EMAILS: z.string().optional(),

  // Fraud detection (optional, has defaults)
  FRAUD_MAX_ACCOUNTS_PER_IP: z.string().default('3'),
  FRAUD_MAX_REFERRALS_PER_HOUR: z.string().default('5'),
  FRAUD_SCAN_SPIKE_THRESHOLD: z.string().default('20'),

  // GCP configuration
  GCP_PROJECT: z.string().default('gen-lang-client-0376848339'),
  GCP_REGION: z.string().default('us-central1'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),

  // Vertex AI OAuth mode
  VERTEX_USE_OAUTH: z.string().default('0')
});

// Schema for client-side environment variables (VITE_ prefix, safe to expose)
const clientEnvSchema = z.object({
  // Required for Paddle frontend
  VITE_PADDLE_CLIENT_TOKEN: z.string().min(1).optional(),
  VITE_PADDLE_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  VITE_PADDLE_PRICE_SINGLE: z.string().optional(),
  VITE_PADDLE_PRICE_BASIC: z.string().optional(),
  VITE_PADDLE_PRICE_PRO: z.string().optional(),

  // Required for site access control
  VITE_SITE_PASSWORD: z.string().optional(),

  // Required for CAPTCHA
  VITE_TURNSTILE_SITE_KEY: z.string().min(1).optional(),

  // Required for analytics
  VITE_PUBLIC_POSTHOG_KEY: z.string().optional(),
  VITE_PUBLIC_POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com')
});

// Combined schema
const fullEnvSchema = serverEnvSchema.merge(clientEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type FullEnv = z.infer<typeof fullEnvSchema>;

let validatedEnv: FullEnv | null = null;

/**
 * Validate environment variables on startup
 *
 * Call this early in your application lifecycle (before any routes are mounted).
 * Will throw an error if required variables are missing in production.
 *
 * @throws {Error} If required environment variables are missing
 */
export function validateEnv(): FullEnv {
  if (validatedEnv) {
    return validatedEnv;
  }

  // Some dotenv loaders (or quoted .env files) leak literal quote chars into
  // values, e.g. APP_URL becomes `"http://localhost:3000"` instead of
  // `http://localhost:3000`. Strip a single matching pair of leading/trailing
  // double or single quotes from every env var before validation.
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value !== 'string') continue;
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      process.env[key] = value.slice(1, -1);
    }
  }

  try {
    validatedEnv = fullEnvSchema.parse(process.env);

    // In production, warn about optional but recommended variables
    if (process.env.NODE_ENV === 'production') {
      const warnings: string[] = [];

      if (!process.env.UPSTASH_REDIS_REST_URL) {
        warnings.push('⚠️  UPSTASH_REDIS_REST_URL not set - rate limiting disabled');
      }
      if (!process.env.VITE_PADDLE_CLIENT_TOKEN || !process.env.PADDLE_WEBHOOK_SECRET) {
        warnings.push('⚠️  Paddle env vars not fully set - payments may be disabled');
      }
      if (!process.env.RESEND_API_KEY) {
        warnings.push('⚠️  RESEND_API_KEY not set - email notifications disabled');
      }
      if (!process.env.TURNSTILE_SECRET_KEY) {
        warnings.push('⚠️  TURNSTILE_SECRET_KEY not set - CAPTCHA disabled');
      }
      if (!process.env.VITE_PUBLIC_POSTHOG_KEY) {
        warnings.push('⚠️  VITE_PUBLIC_POSTHOG_KEY not set - analytics disabled');
      }

      if (warnings.length > 0) {
        console.warn('\n=== Environment Warnings ===');
        warnings.forEach((w) => console.warn(w));
        console.warn('===========================\n');
      }
    }

    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');

      console.error('\n❌ Environment Validation Failed');
      console.error('The following environment variables are required but missing or invalid:\n');
      console.error(missingVars);
      console.error('\n📝 Please check your .env file or deployment environment variables.');
      console.error('📖 See .env.example for all required variables.\n');

      // In production, exit immediately
      if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
        process.exit(1);
      }

      // In development, throw error but allow continuing
      throw new Error(`Environment validation failed: ${error.message}`);
    }

    throw error;
  }
}

/**
 * Get validated environment variables
 *
 * @returns Validated environment variables
 * @throws {Error} If validateEnv() hasn't been called yet
 */
export function getEnv(): FullEnv {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call validateEnv() first.');
  }
  return validatedEnv;
}

// Export validated env for convenience (must call validateEnv() first)
export const env = new Proxy({} as FullEnv, {
  get(_target, prop: keyof FullEnv) {
    if (!validatedEnv) {
      throw new Error(`Accessing env.${String(prop)} before validateEnv() was called`);
    }
    return validatedEnv[prop];
  }
});

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.NETLIFY;
}

/**
 * Check if rate limiting is enabled
 */
export function hasRateLimiting(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Check if payments are enabled
 */
export function hasPayments(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/**
 * Check if email notifications are enabled
 */
export function hasEmail(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Check if CAPTCHA is enabled
 */
export function hasCaptcha(): boolean {
  return !!(process.env.TURNSTILE_SECRET_KEY && process.env.VITE_TURNSTILE_SITE_KEY);
}

/**
 * Check if analytics are enabled
 */
export function hasAnalytics(): boolean {
  return !!process.env.VITE_PUBLIC_POSTHOG_KEY;
}
