import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
// Use default WebChannel transport. `experimentalForceLongPolling` was removed —
// it more than doubles Firestore reads/billing and is only needed for legacy
// corporate proxies. Re-enable here if you measurably need it.
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

// NOTE: Removed the `testConnection()` probe that called getDocFromServer on every
// module load — it consumed one Firestore read per page load / HMR reload, which was
// the single biggest source of the "free tier daily read quota" exhaustion in dev.
// If you need connectivity diagnostics, use the Firebase Emulator or a one-off script.

export default app;
