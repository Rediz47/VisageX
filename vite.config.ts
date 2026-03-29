import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

const require = createRequire(import.meta.url);
const Prerender = require('vite-plugin-prerender');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      ViteImageOptimizer({
        png: { quality: 80, compressionLevel: 8 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { quality: 80, lossless: false },
        avif: { quality: 70, lossless: false }
      }),
      Prerender({
        staticDir: path.join(process.cwd(), 'dist'),
        routes: [
          '/', 
          '/methodology', 
          '/privacy', 
          '/terms', 
          '/blog',
          '/blog/how-to-improve-face-symmetry', 
          '/blog/ai-face-analysis-explained', 
          '/blog/best-ai-face-analysis-tool',
          '/blog/what-is-canthal-tilt',
          '/blog/how-to-fix-recessed-jawline',
          '/blog/does-gua-sha-work'
        ],
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
