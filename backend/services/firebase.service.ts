import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import { readFileSync, existsSync } from 'fs';

let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

export function getAdminApp() {
  if (!admin.apps?.length) {
    const isStrictEnv = process.env.NODE_ENV === 'production' || !!process.env.NETLIFY;

    // 1. Check for Service Account in environment variables (JSON string)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const cleanJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        const cert = JSON.parse(cleanJson);

        // Handle common formatting issue: replace escaped newlines in private_key
        if (cert.private_key) {
          cert.private_key = cert.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(cert),
          projectId: cert.project_id
        });
        console.log('Firebase Admin Initialized via Environment Variable.');
        return admin.app();
      } catch (e: any) {
        console.error(
          'CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT env var. Check for copy-paste errors.',
          e.message
        );
        // In strict environments (production/Netlify), don't silently fall through to
        // unauthenticated defaults — that causes Firestore/Auth calls to hang against
        // the GCP metadata server until Lambda timeout, surfacing as 502 to clients.
        if (isStrictEnv) {
          throw new Error(
            `Firebase Admin init failed: FIREBASE_SERVICE_ACCOUNT is invalid JSON (${e.message})`
          );
        }
      }
    } else if (isStrictEnv) {
      throw new Error(
        'Firebase Admin init failed: FIREBASE_SERVICE_ACCOUNT environment variable is not set'
      );
    }

    // 2. Fallback to local files (development only)
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!existsSync(configPath)) {
      console.warn('Firebase config not found! Initializing with defaults.');
      admin.initializeApp();
      return admin.app();
    }

    const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    const certPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

    if (!existsSync(certPath)) {
      admin.initializeApp({ projectId: firebaseConfig.projectId });
    } else {
      const cert = JSON.parse(readFileSync(certPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(cert),
        projectId: firebaseConfig.projectId
      });
    }
  }
  return admin.app();
}

export function getAdminDb() {
  if (!adminDb) {
    const app = getAdminApp();
    let databaseId = '(default)';

    // Priority 1: Environment variable (works on Netlify and all deployments)
    if (process.env.FIRESTORE_DATABASE_ID) {
      databaseId = process.env.FIRESTORE_DATABASE_ID;
    } else {
      // Priority 2: Local config file (works in local development)
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (existsSync(configPath)) {
        const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
        if (firebaseConfig.firestoreDatabaseId) {
          databaseId = firebaseConfig.firestoreDatabaseId;
        }
      }
    }

    console.log(`Firestore connecting to database: "${databaseId}"`);
    adminDb = getFirestore(app, databaseId);
  }
  return adminDb;
}

export function getAdminAuth() {
  if (!adminAuth) {
    const app = getAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}
