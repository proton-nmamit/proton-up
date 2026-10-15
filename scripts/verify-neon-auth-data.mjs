import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
});

const sql = neon(env.DATABASE_URL);

async function run() {
  console.log('=== VERIFYING NEON AUTH DATA ===');

  const users = await sql`
    SELECT u.id, u.name, u.email, u.role, a.password IS NOT NULL as has_password
    FROM neon_auth.user u
    JOIN neon_auth.account a ON u.id = a."userId"
    ORDER BY u.role DESC, u.name ASC
  `;

  console.log(`Total active user-account pairs in neon_auth: ${users.length}`);
  console.table(users.slice(0, 10));

  // Check identity match with public.profiles
  const profileMatches = await sql`
    SELECT count(*) as count
    FROM public.profiles p
    JOIN neon_auth.user u ON p.user_id = u.id
  `;
  console.log(`Profile-to-User 1:1 UUID matches: ${profileMatches[0].count} / 41`);

  if (Number(profileMatches[0].count) === 41) {
    console.log('PASS: 100% Identity mapping verified between public.profiles and neon_auth.user!');
  } else {
    console.error('FAIL: Discrepancy in identity mapping.');
  }
}

run().catch(console.error);
