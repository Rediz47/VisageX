import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';

import aiRoutes from './routes/ai.routes.js';
import geometryRoutes from './routes/geometry.routes.js';
import paypalRoutes from './routes/paypal.routes.js';
import referralRoutes from './routes/referral.routes.js';
import emailRoutes from './routes/email.routes.js';
import authRoutes from './routes/auth.routes.js';

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

  // Health check endpoint for debugging
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      env: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasFirebaseAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
        nodeEnv: process.env.NODE_ENV,
        isNetlify: !!process.env.NETLIFY
      }
    });
  });

  // Mount API Routes
  app.use('/api', geometryRoutes);
  app.use('/api', aiRoutes);
  app.use('/api/paypal', paypalRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api/auth', authRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ 
      error: "Internal server error",
      message: err.message,
      path: req.path
    });
  });

  app.use(express.static('dist'));

  return app;
}

// configureApp() call removed to prevent race conditions in serverless environments.
// It is explicitly called in backend/index.ts (local) and netlify/functions/api.ts (serverless).
