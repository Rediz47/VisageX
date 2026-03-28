import serverless from 'serverless-http';
import { app, configureApp } from '../../backend/app.js';

let initialized = false;

export const handler = async (event: any, context: any) => {
  if (!initialized) {
    await configureApp();
    initialized = true;
  }
  const serve = serverless(app);
  return await serve(event, context);
};
