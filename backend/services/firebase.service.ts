import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import { readFileSync, existsSync } from 'fs';

let adminDb: admin.firestore.Firestore | null = null;
let adminAuth: admin.auth.Auth | null = null;

export function getAdminApp() {
  if (!admin.apps?.length) {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!existsSync(configPath)) {
      console.warn("firebase-applet-config.json not found! Using default init.");
      admin.initializeApp();
      return admin.app();
    }
    
    const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
    
    const certPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (!existsSync(certPath)) {
       console.warn("serviceAccountKey.json not found! Relying on Application Default Credentials (ADC).");
       admin.initializeApp({
          projectId: firebaseConfig.projectId,
       });
    } else {
       const cert = JSON.parse(readFileSync(certPath, 'utf8'));
       const credential = admin.credential.cert(cert);
       admin.initializeApp({
         credential,
         projectId: firebaseConfig.projectId,
       });
    }
  }
  return admin.app();
}

export function getAdminDb() {
  if (!adminDb) {
    const app = getAdminApp();
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    let databaseId = '(default)';
    if (existsSync(configPath)) {
        const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));
        if (firebaseConfig.firestoreDatabaseId) {
            databaseId = firebaseConfig.firestoreDatabaseId;
        }
    }
    
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
