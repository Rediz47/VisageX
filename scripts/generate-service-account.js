import fs from 'fs';
import path from 'path';

const envVal = process.env.FIREBASE_SERVICE_ACCOUNT;
if (envVal) {
  try {
    let cleanVal = envVal.trim();
    if (cleanVal.startsWith("'") && cleanVal.endsWith("'")) {
      cleanVal = cleanVal.slice(1, -1).trim();
    }
    if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
      cleanVal = cleanVal.slice(1, -1).trim();
    }
    const parsed = JSON.parse(cleanVal);
    const destPath = path.join(process.cwd(), 'firebase-service-account.json');
    fs.writeFileSync(destPath, JSON.stringify(parsed, null, 2), 'utf8');
    console.log('Successfully generated firebase-service-account.json from env variable.');
  } catch (err) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT during build:', err.message);
    process.exit(1);
  }
} else {
  console.log('FIREBASE_SERVICE_ACCOUNT not set in build environment. Skipping file generation.');
}
