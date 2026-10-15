import fs from 'fs';
import crypto from 'crypto';

const envPath = '.env.local';
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

// 1. Check or generate BETTER_AUTH_SECRET
if (!envContent.includes('BETTER_AUTH_SECRET=')) {
  const secret = crypto.randomBytes(32).toString('hex');
  envContent += `\n# Better Auth / Neon Auth Configuration\nBETTER_AUTH_SECRET=${secret}\nBETTER_AUTH_URL=http://localhost:3000\n`;
}

// 2. Add RESEND_API_KEY placeholder if not present
if (!envContent.includes('RESEND_API_KEY=')) {
  envContent += `\n# Email Delivery\n# RESEND_API_KEY=re_your_api_key_here\n`;
}

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Environment configuration updated successfully in .env.local');
