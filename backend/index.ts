import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';

import aiRoutes from './routes/ai.routes.js';
import geometryRoutes from './routes/geometry.routes.js';
import paypalRoutes from './routes/paypal.routes.js';
import referralRoutes from './routes/referral.routes.js';
import emailRoutes from './routes/email.routes.js';
import authRoutes from './routes/auth.routes.js';

async function startServer() {
  const app = express();
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

  // Mount API Routes strictly mirroring old structure to maintain frontend compatibility
  // Geometry
  app.use('/api', geometryRoutes); // Mounts /api/analyze

  // AI & Gemini
  app.use('/api', aiRoutes); // Mounts /api/gemini-analysis, /api/celebrity-lookalike, /api/glow-coach

  // PayPal
  app.use('/api/paypal', paypalRoutes);

  // Referral
  app.use('/api/referral', referralRoutes);

  // Emails
  app.use('/api/email', emailRoutes);

  // Auth (Init Secure User)
  app.use('/api/auth', authRoutes);

  // Note: The previous /api/consume-credit has intentionally been removed
  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: "Internal server error" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend Initialized. Secure Server running on http://localhost:${PORT}`);
  });
}

startServer();
