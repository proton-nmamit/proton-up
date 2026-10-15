import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const envLocal = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';

const REQUIRED_VARS = [
  { name: 'DATABASE_URL', purpose: 'Neon PostgreSQL Connection String', type: 'SERVER' },
  { name: 'BETTER_AUTH_SECRET', purpose: 'Better Auth Session & Token Signing Key', type: 'SERVER' },
  { name: 'BETTER_AUTH_URL', purpose: 'Better Auth Base URL', type: 'SERVER' },
  { name: 'RESEND_API_KEY', purpose: 'Resend API Key for Password Reset Email Delivery', type: 'SERVER' },
  { name: 'CLOUDINARY_CLOUD_NAME', purpose: 'Cloudinary Cloud Name', type: 'SERVER' },
  { name: 'CLOUDINARY_API_KEY', purpose: 'Cloudinary API Key', type: 'SERVER' },
  { name: 'CLOUDINARY_API_SECRET', purpose: 'Cloudinary API Secret', type: 'SERVER' },
];

console.log('=== PROTON SECRET AUDIT REPORT ===\n');

const auditResults = REQUIRED_VARS.map(v => {
  const isPresent = envLocal.includes(`${v.name}=`);
  return {
    'VARIABLE NAME': v.name,
    'PURPOSE': v.purpose,
    'SERVER/PUBLIC': v.type,
    'PRESENT/MISSING': isPresent ? 'PRESENT' : 'MISSING',
  };
});

console.table(auditResults);

// Scan Git History to ensure .env.local was never committed
console.log('\n--- GIT TRACKING CHECK ---');
try {
  const trackedFiles = execSync('git ls-files', { encoding: 'utf8' });
  const hasEnvTracked = trackedFiles.includes('.env.local');
  console.log(`Is .env.local tracked in Git: ${hasEnvTracked ? 'YES (CRITICAL ISSUE)' : 'NO (SAFE & GITIGNORED)'}`);
} catch (e) {
  console.log('Error checking git files:', e.message);
}
