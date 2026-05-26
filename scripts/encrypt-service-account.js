import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load local .env
dotenv.config();

const envVal = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!envVal) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT is not set in your local .env file.');
  process.exit(1);
}

try {
  let cleanVal = envVal.trim();
  if (cleanVal.startsWith("'") && cleanVal.endsWith("'")) {
    cleanVal = cleanVal.slice(1, -1).trim();
  }
  if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
    cleanVal = cleanVal.slice(1, -1).trim();
  }

  // Validate JSON
  JSON.parse(cleanVal);

  // Generate encryption key and IV
  const algorithm = 'aes-256-cbc';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cleanVal, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Format: iv:encrypted_data
  const outputData = `${iv.toString('hex')}:${encrypted}`;
  
  const destPath = path.join(process.cwd(), 'firebase-service-account.enc');
  fs.writeFileSync(destPath, outputData, 'utf8');

  console.log('\n==================================================');
  console.log('✅ SUCCESS: Encrypted service account file generated!');
  console.log('File created: firebase-service-account.enc');
  console.log('==================================================\n');
  console.log('Please copy this key and set it as an environment variable in Netlify:');
  console.log(`Key name:  FIREBASE_DECRYPTION_KEY`);
  console.log(`Value:     ${key.toString('hex')}`);
  console.log('\n==================================================\n');

} catch (err) {
  console.error('Failed to encrypt service account:', err.message);
  process.exit(1);
}
