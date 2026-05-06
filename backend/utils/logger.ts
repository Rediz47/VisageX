import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;

const baseOptions = {
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  base: { service: 'visagex-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive fields from logs
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.image'],
    censor: '[REDACTED]'
  }
};

// In production/Netlify, force pino to write SYNCHRONOUSLY to stdout via
// pino.destination({ sync: true }). This bypasses pino's default async
// `thread-stream` worker, whose worker entry script (`./lib/worker.js`) gets
// stripped from the function bundle by esbuild. Without this, every logged
// request crashes the Lambda invocation with:
//   Cannot find module '/var/task/netlify/functions/lib/worker.js'
// surfacing to clients as 502 Bad Gateway.
export const logger = isDev
  ? pino({
      ...baseOptions,
      transport: { target: 'pino/file', options: { destination: 1 } }
    })
  : pino(baseOptions, pino.destination({ sync: true }));

export default logger;
