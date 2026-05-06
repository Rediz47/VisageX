// In serverless (Netlify) we deliberately AVOID pino. Pino's default async
// transport spawns a worker thread (thread-stream/lib/worker.js) whose path
// gets mangled by esbuild bundling, crashing the Lambda with
//   Cannot find module '/var/task/netlify/functions/lib/worker.js'
// surfacing to clients as a 502 Bad Gateway. A plain console-based logger is
// fully synchronous, has zero native dependencies, and Netlify automatically
// captures stdout/stderr into the function logs panel.
//
// In local dev we still use pino for pretty/colored output via pino-pretty.

const isDev = process.env.NODE_ENV !== 'production' && !process.env.NETLIFY;

interface SimpleLogger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  child: (bindings?: Record<string, unknown>) => SimpleLogger;
}

function createConsoleLogger(): SimpleLogger {
  const self: SimpleLogger = {
    info: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    debug: (...args) => {
      if (process.env.LOG_LEVEL === 'debug') console.log(...args);
    },
    child: () => self
  };
  return self;
}

async function createDevLogger(): Promise<SimpleLogger> {
  const { default: pino } = await import('pino');
  const p = pino({
    level: process.env.LOG_LEVEL || 'debug',
    transport: { target: 'pino/file', options: { destination: 1 } },
    base: { service: 'visagex-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.image'],
      censor: '[REDACTED]'
    }
  });
  return p as unknown as SimpleLogger;
}

// Synchronous export of a logger usable everywhere. In dev we upgrade to pino
// asynchronously after first import; until then, console is used. This keeps
// the module load fast and avoids any worker-thread surprises in production.
export const logger: SimpleLogger = createConsoleLogger();

if (isDev) {
  // Best-effort upgrade for nicer dev output. If pino import fails for any
  // reason, the console logger continues working.
  void createDevLogger()
    .then((p) => {
      logger.info = p.info.bind(p);
      logger.warn = p.warn.bind(p);
      logger.error = p.error.bind(p);
      logger.debug = p.debug.bind(p);
      logger.child = p.child.bind(p) as SimpleLogger['child'];
    })
    .catch((e) => {
      console.warn('Falling back to console logger (pino unavailable):', e?.message);
    });
}

export default logger;
