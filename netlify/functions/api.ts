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

export const handler = async (event: any, context: any) => {
  const fn = await getServe();
  return fn(event, context);
};
