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
    res.status(500).json({ error: "Internal server error" });
  });

  app.use(express.static('dist'));

  return app;
}

// Netlify/Serverless will call configureApp() as needed or we do it here:
configureApp();
