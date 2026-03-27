import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

// Initialize Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
} catch (e: any) {
  console.log('Error reading service account key:', e.message);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkScans() {
  try {
    const scansSnapshot = await db.collection('scans').limit(5).get();
    if (scansSnapshot.empty) {
      console.log('No scans found in database whatsoever.');
    } else {
      console.log('Found recent scans:');
      scansSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`  User: ${data.userId} (${data.userEmail})`);
        console.log(`  Date: ${data.createdAt}`);
        console.log(`  Score: ${data.overallScore}`);
      });
    }
  } catch (err: any) {
    console.error('Error MESSAGE:', err.message);
    console.error('Error CODE:', err.code);
    console.error('Error DETAILS:', err.details);
  }
}

checkScans();
