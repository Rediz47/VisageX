import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const decryptionKey = process.env.FIREBASE_DECRYPTION_KEY;
const encryptedFilePath = path.join(process.cwd(), 'firebase-service-account.enc');
const destPath = path.join(process.cwd(), 'firebase-service-account.json');

if (decryptionKey && fs.existsSync(encryptedFilePath)) {
  try {
    const fileContent = fs.readFileSync(encryptedFilePath, 'utf8').trim();
    const parts = fileContent.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted file format. Expected iv:data');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = Buffer.from(decryptionKey.trim(), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Validate that the decrypted content is valid JSON
    JSON.parse(decrypted);
    
    fs.writeFileSync(destPath, decrypted, 'utf8');
    console.log('Successfully decrypted and generated firebase-service-account.json.');
  } catch (err) {
    console.error('Error decrypting firebase-service-account.enc:', err.message);
    process.exit(1);
  }
} else {
  // Fallback to unencrypted env var if decryption key is not set
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
      fs.writeFileSync(destPath, JSON.stringify(parsed, null, 2), 'utf8');
      console.log('Successfully generated firebase-service-account.json from unencrypted env variable.');
    } catch (err) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT during build:', err.message);
      process.exit(1);
    }
  } else {
    console.log('Neither FIREBASE_DECRYPTION_KEY nor FIREBASE_SERVICE_ACCOUNT set in build environment. Skipping file generation.');
  }
}
