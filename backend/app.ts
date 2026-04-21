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
  app.use('/ingest', createProxyMiddleware({
    target: process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    changeOrigin: true,
    pathRewrite: {
      '^/ingest': ''
    }
  }));

  app.use(express.json({ limit: '50mb' }));

  // Request logging with unique request IDs
  app.use(pinoHttp({
    logger,
    genReqId: () => randomUUID(),
    autoLogging: {
      ignore: (req) => req.url === '/api/health', // Don't log health checks
    },
  }));

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Managed by frontend framework
    crossOriginEmbedderPolicy: false, // Allow external images/fonts
  }));

  // Bot protection — block known scrapers, AI crawlers, and empty user-agents on API routes
  app.use(blockBots);

  // CORS — restrict to allowed origin
  app.use((req, res, next) => {
    const allowedOrigin = process.env.APP_URL || 'https://visagex.online';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
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

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ 
      error: "Internal server error"
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
