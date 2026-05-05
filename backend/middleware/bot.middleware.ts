import { Request, Response, NextFunction } from 'express';

// ── Layer 1: Known bot User-Agent blocklist ─────────────────────────────────
const BLOCKED_BOTS = [
  // AI training crawlers
  'GPTBot',
  'CCBot',
  'Google-Extended',
  'anthropic-ai',
  'ClaudeBot',
  'Bytespider',
  'Diffbot',
  'FacebookBot',
  'Omgilibot',
  'Amazonbot',
  // Aggressive SEO crawlers
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'DataForSeoBot',
  'PetalBot',
  'Seekport',
  // Scraping tools
  'python-requests',
  'Go-http-client',
  'Java/',
  'libwww-perl',
  'Scrapy',
  'curl/',
  'wget/'
];

// Pre-compile a single regex for fast matching
const BOT_REGEX = new RegExp(
  BLOCKED_BOTS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ── Layer 2: Headless browser / automation indicators ───────────────────────
const HEADLESS_INDICATORS = [
  'HeadlessChrome',
  'PhantomJS',
  'Nightmare',
  'Selenium',
  'WebDriver',
  'puppeteer',
  'playwright',
  'CasperJS',
  'Electron/',
  'Slimer'
];
const HEADLESS_REGEX = new RegExp(
  HEADLESS_INDICATORS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// ── Layer 3: Behavioral signal scoring ──────────────────────────────────────
// Each missing "normal browser" signal adds suspicion points.
// Real browsers always send these; automation tools often omit them.
function computeSuspicionScore(req: Request): number {
  let score = 0;
  const headers = req.headers;

  // Real browsers always send Accept header with text/html or application/json
  if (!headers['accept']) score += 2;

  // Real browsers always send Accept-Language
  if (!headers['accept-language']) score += 2;

  // Real browsers always send Accept-Encoding
  if (!headers['accept-encoding']) score += 1;

  // Connection header — usually present in real browsers
  if (!headers['connection']) score += 1;

  // sec-fetch-* headers — modern browsers always send these on navigations/XHR
  // Their ABSENCE on an API POST is a strong signal of automation
  if (req.method === 'POST' && req.path.startsWith('/api/')) {
    if (!headers['sec-fetch-mode']) score += 2;
    if (!headers['sec-fetch-site']) score += 1;
    // origin header is sent on CORS POST — missing = suspicious
    if (!headers['origin'] && !headers['referer']) score += 2;
  }

  // sec-ch-ua — Chrome 89+ sends this; its absence with a Chrome UA is suspicious
  const ua = (headers['user-agent'] || '') as string;
  if (ua.includes('Chrome/') && !headers['sec-ch-ua']) score += 2;

  // WebDriver detection via headers (some automation tools leak this)
  if (headers['x-webdriver'] || headers['webdriver']) score += 5;

  return score;
}

// Threshold: requests scoring >= this are blocked.
// Tuned so that a normal browser with unusual config isn't blocked (they score ~2-3)
// but headless automation (missing 5+ signals) gets caught.
const SUSPICION_THRESHOLD = 6;

export function blockBots(req: Request, res: Response, next: NextFunction) {
  const ua = (req.headers['user-agent'] || '') as string;
  const isApiRoute = req.path.startsWith('/api/') && req.path !== '/api/health';

  // Layer 1: Block requests with no user-agent on API routes (likely scripts)
  if (!ua && isApiRoute) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Layer 1: Known bot UA blocklist
  if (BOT_REGEX.test(ua)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Layer 2: Headless browser detection
  if (HEADLESS_REGEX.test(ua)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Layer 3: Behavioral suspicion scoring (only on API routes to avoid blocking static assets)
  if (isApiRoute) {
    const score = computeSuspicionScore(req);
    if (score >= SUSPICION_THRESHOLD) {
      console.warn(
        `[Bot] Blocked suspicious request: score=${score} path=${req.path} ua="${ua.slice(0, 80)}"`
      );
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  next();
}
