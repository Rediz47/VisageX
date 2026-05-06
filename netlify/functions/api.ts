import serverless from 'serverless-http';

// Heavy backend imports (firebase-admin, sharp, pino, helmet, route handlers)
// are deferred to first invocation via dynamic import so the Lambda init phase
// stays small. Without this, the init phase exceeds AWS Lambda's startup
// budget on cold starts and the runtime is killed with `exit status 129`
// (SIGHUP), surfacing to clients as a 502 Bad Gateway.

let serve: ReturnType<typeof serverless> | null = null;
let initPromise: Promise<ReturnType<typeof serverless>> | null = null;

function getServe(): Promise<ReturnType<typeof serverless>> {
  if (serve) return Promise.resolve(serve);
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { app, configureApp } = await import('../../backend/app.js');
    await configureApp();
    serve = serverless(app);
    return serve;
  })();
  return initPromise;
}

// Pre-warm: kick off the heavy backend import during Lambda init's idle time.
// Lambda's init phase only blocks on synchronous top-level code, so this fires
// the async work in the background. By the time the first invocation arrives
// (microseconds to milliseconds later), the import is already in flight, and
// is usually fully resolved before any cold-start request handler runs.
// This keeps the init phase fast (no `exit 129`) while preventing slow
// first-request handler timeouts on heavy endpoints (gemini-analysis,
// scans/save) that previously caused 502s.
getServe().catch(() => {
  // Errors here are intentionally swallowed; the handler will surface them.
});

export const handler = async (event: any, context: any) => {
  const fn = await getServe();
  return fn(event, context);
};
