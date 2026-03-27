import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { configureApp } from './app.js';

const PORT = process.env.PORT || 3000;

async function startLocalServer() {
  const app = await configureApp();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend Initialized. Secure Server running on http://localhost:${PORT}`);
  });
}

startLocalServer();
