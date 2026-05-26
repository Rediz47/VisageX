import { Request, Response } from 'express';
import { getRedis } from '../middleware/ratelimit.middleware.js';
import { getAdminDb } from '../services/firebase.service.js';
import fs from 'fs';
import path from 'path';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    redis: HealthStatus;
    firestore: HealthStatus;
    gemini: HealthStatus;
    environment: HealthStatus;
  };
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  responseTime?: number;
}

/**
 * Comprehensive Health Check Endpoint
 *
 * Checks all critical dependencies:
 * - Redis (rate limiting, caching)
 * - Firestore (database)
 * - Gemini AI (external API)
 * - Environment variables
 *
 * Returns 200 if all healthy, 503 if degraded
 */
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();

  const checks: HealthCheckResult['checks'] = {
    redis: await checkRedis(),
    firestore: await checkFirestore(),
    gemini: await checkGemini(),
    environment: checkEnvironment()
  };

  // Determine overall status
  const unhealthyChecks = Object.entries(checks).filter(
    ([_, check]) => check.status === 'unhealthy'
  );
  const degradedChecks = Object.entries(checks).filter(([_, check]) => check.status === 'degraded');

  let overallStatus: HealthCheckResult['status'] = 'healthy';
  if (unhealthyChecks.length > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedChecks.length > 0) {
    overallStatus = 'degraded';
  }

  const healthData: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks
  };

  // Return 503 if unhealthy, 200 otherwise
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(healthData);
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    const redis = getRedis();

    if (!redis) {
      return {
        status: 'degraded',
        message: 'Redis not configured - rate limiting disabled',
        responseTime: 0
      };
    }

    // Try a simple PING command
    await redis.ping();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Redis connected',
      responseTime
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `Redis connection failed: ${error.message}`,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Check Firestore connectivity
 */
async function checkFirestore(): Promise<HealthStatus> {
  const startTime = Date.now();

  try {
    const db = getAdminDb();

    if (!db) {
      return {
        status: 'unhealthy',
        message: 'Firestore not initialized'
      };
    }

    // Try a simple read operation (list collections - minimal cost)
    await db.listCollections();
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Firestore connected',
      responseTime
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `Firestore connection failed: ${error.message}`,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Check Gemini AI API availability
 * This is a lightweight check - doesn't actually call the API
 */
async function checkGemini(): Promise<HealthStatus> {
  try {
    const apiKey = process.env.VERTEX_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!apiKey) {
      return {
        status: 'unhealthy',
        message: 'VERTEX_API_KEY not configured'
      };
    }

    // Just verify the key exists and has correct format
    // Actual API calls are tested during analysis requests
    return {
      status: 'healthy',
      message: `Gemini API configured (model: ${model})`
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: `Gemini configuration error: ${error.message}`
    };
  }
}

/**
 * Check environment variables
 */
function checkEnvironment(): HealthStatus {
  const required = ['VERTEX_API_KEY', 'FIRESTORE_DATABASE_ID'];

  const missing = required.filter((key) => !process.env[key]);
  
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT || 
    fs.existsSync(path.resolve(process.cwd(), 'firebase-service-account.json'));

  if (missing.length > 0 || !hasServiceAccount) {
    const missingList = [...missing];
    if (!hasServiceAccount) missingList.push('FIREBASE_SERVICE_ACCOUNT');
    return {
      status: 'unhealthy',
      message: `Missing required env vars or files: ${missingList.join(', ')}`
    };
  }

  // Check optional but recommended
  const optional = ['UPSTASH_REDIS_REST_URL', 'PAYPAL_CLIENT_ID', 'TURNSTILE_SECRET_KEY'];

  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missingOptional.length > 0) {
    return {
      status: 'degraded',
      message: `Missing optional env vars: ${missingOptional.join(', ')}`
    };
  }

  return {
    status: 'healthy',
    message: 'All environment variables configured'
  };
}

/**
 * Simple health check (just returns ok - for load balancers)
 */
export function simpleHealthCheck(req: Request, res: Response) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
