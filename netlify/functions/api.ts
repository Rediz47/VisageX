import serverless from 'serverless-http';
import { app, configureApp } from '../../backend/app.js';

let initialized = false;
let serve: ReturnType<typeof serverless>;

export const handler = async (event: any, context: any) => {
  if (!initialized) {
    await configureApp();
    serve = serverless(app);
    initialized = true;
  }
  return await serve(event, context);
};
