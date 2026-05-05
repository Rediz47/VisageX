import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { blockBots } from './middleware/bot.middleware.js';
import logger from './utils/logger.js';

import aiRoutes from './routes/ai.routes.js';
import geometryRoutes from './routes/geometry.routes.js';
import paypalRoutes from './routes/paypal.routes.js';
import referralRoutes from './routes/referral.routes.js';
import emailRoutes from './routes/email.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import scanRoutes from './routes/scan.routes.js';

export const app = express();

export async function configureApp() {
  const PORT = process.env.PORT || 3000;

  // PostHog Reverse Proxy
  app.use(
    '/ingest',
    createProxyMiddleware({
      target: process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      changeOrigin: true,
      pathRewrite: {
        '^/ingest': ''
      }
    })
  );

  app.use(
    ['/api/gemini-analysis', '/api/celebrity-lookalike', '/api/hair-analysis'],
    express.json({ limit: '50mb' })
  );
  app.use('/api/scans/save', express.json({ limit: '2mb' }));
  app.use(express.json({ limit: '1mb' }));

  // Request logging with unique request IDs.
  // In dev, only log /api/* (skip Vite HMR, static assets, source files that would
  // otherwise flood stdout and make the terminal unreadable).
  const isDevServer = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;
  app.use(
    pinoHttp({
      logger,
      genReqId: () => randomUUID(),
      autoLogging: {
        ignore: (req) => {
          const url = req.url || '';
          if (url === '/api/health') return true;
          if (isDevServer) {
            // Only log real API traffic in dev; skip everything else (Vite, static, HMR).
            if (!url.startsWith('/api/')) return true;
          }
          return false;
        }
      },
      // Compact one-line summary instead of the giant JSON object per request.
      serializers: {
        req: (req) => ({ method: req.method, url: req.url, id: req.id }),
        res: (res) => ({ statusCode: res.statusCode })
      }
    })
  );

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'wasm-unsafe-eval'",
            'https://www.paypal.com',
            'https://www.paypalobjects.com',
            'https://us.i.posthog.com',
            'https://challenges.cloudflare.com',
            'https://cdn.jsdelivr.net'
          ],
          connectSrc: [
            "'self'",
            'https://*.googleapis.com',
            'https://*.firebaseio.com',
            'wss://*.firebaseio.com',
            'https://*.firebase.com',
            'https://generativelanguage.googleapis.com',
            'https://us.i.posthog.com',
            'https://api.paypal.com',
            'https://api.sandbox.paypal.com',
            'https://api.resend.com',
            'https://challenges.cloudflare.com',
            'https://cdn.jsdelivr.net',
            'https://storage.googleapis.com'
          ],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          frameSrc: [
            'https://www.paypal.com',
            'https://www.sandbox.paypal.com',
            'https://challenges.cloudflare.com'
          ],
          workerSrc: ["'self'", 'blob:']
        }
      },
      crossOriginEmbedderPolicy: false, // Allow external images/fonts
      // Firebase Google sign-in popups need to postMessage back to the opener.
      // The default 'same-origin' COOP blocks this and the popup appears to close
      // itself, giving a misleading `auth/popup-closed-by-user` error.
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
    })
  );

  // Bot protection — block known scrapers, AI crawlers, and empty user-agents on API routes
  app.use(blockBots);

  // CORS — validate origin against an allowlist (supports comma-separated APP_URL)
  const corsAllowlist = (process.env.APP_URL || 'https://visagex.online')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && corsAllowlist.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (!origin) {
      // Same-origin / non-browser request — no CORS header needed.
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check — no environment details exposed
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount API Routes
  app.use('/api', geometryRoutes);
  app.use('/api', aiRoutes);
  app.use('/api/paypal', paypalRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/scans', scanRoutes);

  // Global Error Handler — log via pino so the request ID is preserved.
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const reqLog = (req as any).log || logger;
    reqLog.error({ err }, 'Unhandled server error');
    res.status(500).json({
      error: 'Internal server error',
      requestId: (req as any).id
    });
  });
  // Only serve static build directory in production, otherwise Vite middleware handles it
  if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
    app.use(express.static('dist'));
  }
  return app;
}

// configureApp() call removed to prevent race conditions in serverless environments.
// It is explicitly called in backend/index.ts (local) and netlify/functions/api.ts (serverless).
