import 'dotenv/config';
import { configureApp } from './app.js';

const PORT = process.env.PORT || 3000;

configureApp().then((app) => {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Backend Initialized. Secure Server running on http://localhost:${PORT}`);
  });
});
