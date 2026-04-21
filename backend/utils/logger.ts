import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? { target: 'pino/file', options: { destination: 1 } } // pretty output in dev (stdout)
    : undefined, // JSON output in production (Netlify log parsing)
  base: { service: 'visagex-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.image'],
    censor: '[REDACTED]',
  },
});

export default logger;
