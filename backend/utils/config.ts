import { z } from 'zod';

// ── Environment Schema ──────────────────────────────────────────────────────
// Validates ALL required and optional env vars at startup.
// App will crash immediately if critical vars are missing in production.

const envSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']).default('development'),
  PORT: z.string().optional().default('3000'),

  // Firebase
  FIREBASE_SERVICE_ACCOUNT: z.string().optional(),
  FIRESTORE_DATABASE_ID: z.string().optional(),

  // Vertex AI
  VERTEX_API_KEY: z.string().min(1, 'VERTEX_API_KEY is required'),
  GCP_PROJECT: z.string().optional(),
  GCP_REGION: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),

  // Upstash Redis (rate limiting + caching)
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // PayPal
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // App
  APP_URL: z.string().url().catch('https://visagex.online'),
  VITE_PUBLIC_POSTHOG_HOST: z.string().optional(),

  // Netlify indicator
  NETLIFY: z.string().optional(),

  // Admin emails (comma-separated)
  ADMIN_EMAILS: z.string().optional().default(''),

  // Fraud detection thresholds
  FRAUD_MAX_ACCOUNTS_PER_IP: z.coerce.number().optional().default(3),
  FRAUD_MAX_REFERRALS_PER_HOUR: z.coerce.number().optional().default(5),
  FRAUD_SCAN_SPIKE_THRESHOLD: z.coerce.number().optional().default(20),
  FRAUD_RISK_BLOCK_EXPENSIVE: z.coerce.number().optional().default(70)
});

export type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

/**
 * Validates and returns the environment configuration.
 * Crashes the process in production if critical vars are missing.
 * In development, logs warnings but allows running with defaults.
 */
export function getConfig(): EnvConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    const msg = `\n❌ ENVIRONMENT VALIDATION FAILED:\n${errors}\n`;

    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
      console.error(msg);
      process.exit(1);
    } else {
      console.warn(msg);
      console.warn('⚠️  Running in degraded mode (development). Some features may not work.\n');
      // In dev, use partial config with defaults
      _config = envSchema.partial().parse(process.env) as EnvConfig;
      return _config;
    }
  }

  _config = result.data;
  return _config;
}

/**
 * Returns admin emails from environment (comma-separated list).
 * Falls back to empty array if not configured.
 */
export function getAdminEmails(): string[] {
  const config = getConfig();
  if (!config.ADMIN_EMAILS) return [];
  return config.ADMIN_EMAILS.split(',')
    .map((e) => e.trim())
    .filter(Boolean);
}

/**
 * Check if the app is running in production mode.
 */
export function isProduction(): boolean {
  const config = getConfig();
  return config.NODE_ENV === 'production' || !!config.NETLIFY;
}

/**
 * Check if the app is running in development mode.
 */
export function isDevelopment(): boolean {
  return !isProduction();
}
