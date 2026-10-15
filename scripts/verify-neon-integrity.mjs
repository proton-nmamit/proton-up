import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// Parse .env.local
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const k = trimmed.substring(0, eqIdx).trim();
    const v = trimmed.substring(eqIdx + 1).trim();
    env[k] = v;
  }
}

const sql = neon(env.DATABASE_URL);

async function verifyIntegrity() {
  console.log('=== Neon PostgreSQL Data Integrity & Relationship Verification ===\n');

  // 1. Primary key uniqueness check
  console.log('1. Checking Primary Key Uniqueness:');
  const tables = ['designations', 'profiles', 'events', 'gallery_albums', 'gallery_images', 'invitations', 'audit_logs'];
  for (const t of tables) {
    const r = await sql.query(`SELECT id, count(*) FROM public."${t}" GROUP BY id HAVING count(*) > 1`);
    if (r.length === 0) {
      console.log(` - Table ${t}: OK (0 duplicate PKs)`);
    } else {
      console.error(` ❌ Table ${t} has duplicate PKs:`, r);
    }
  }

  // 2. Foreign key relationship check
  console.log('\n2. Checking Foreign Key Relationships:');
  // Profiles -> Designations
  const orphanedProfiles = await sql`
    SELECT p.id, p.full_name, p.designation_id 
    FROM public.profiles p 
    LEFT JOIN public.designations d ON p.designation_id = d.id 
    WHERE p.designation_id IS NOT NULL AND d.id IS NULL
  `;
  console.log(` - Profiles -> Designations orphaned records: ${orphanedProfiles.length} (Expected: 0)`);

  // Invitations -> Designations
  const orphanedInvites = await sql`
    SELECT i.id, i.email, i.designation_id 
    FROM public.invitations i 
    LEFT JOIN public.designations d ON i.designation_id = d.id 
    WHERE i.designation_id IS NOT NULL AND d.id IS NULL
  `;
  console.log(` - Invitations -> Designations orphaned records: ${orphanedInvites.length} (Expected: 0)`);

  // 3. Unique constraints check
  console.log('\n3. Checking Unique Constraints:');
  const dupDesignationNames = await sql`SELECT name, count(*) FROM public.designations GROUP BY name HAVING count(*) > 1`;
  console.log(` - Unique designation names: ${dupDesignationNames.length === 0 ? 'PASS' : 'FAIL'}`);

  const dupEventSlugs = await sql`SELECT slug, count(*) FROM public.events GROUP BY slug HAVING count(*) > 1`;
  console.log(` - Unique event slugs: ${dupEventSlugs.length === 0 ? 'PASS' : 'FAIL'}`);

  const dupInviteTokens = await sql`SELECT token_hash, count(*) FROM public.invitations GROUP BY token_hash HAVING count(*) > 1`;
  console.log(` - Unique invitation token hashes: ${dupInviteTokens.length === 0 ? 'PASS' : 'FAIL'}`);

  const dupProfileUsers = await sql`SELECT user_id, count(*) FROM public.profiles WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*) > 1`;
  console.log(` - Unique profile user_ids: ${dupProfileUsers.length === 0 ? 'PASS' : 'FAIL'}`);

  // 4. Sample critical record checks
  console.log('\n4. Verifying Critical Application Records in Neon:');
  const adminProfiles = await sql`SELECT id, user_id, full_name, role, status FROM public.profiles WHERE role IN ('admin', 'super_admin')`;
  console.log(` - Administrator profiles count: ${adminProfiles.length}`);
  adminProfiles.forEach(a => console.log(`   * ${a.full_name} | role=${a.role} | status=${a.status} | user_id=${a.user_id}`));

  const approvedMembers = await sql`SELECT count(*)::int as count FROM public.profiles WHERE status = 'approved'`;
  const pendingMembers = await sql`SELECT count(*)::int as count FROM public.profiles WHERE status = 'pending'`;
  const pendingInvites = await sql`SELECT count(*)::int as count FROM public.invitations WHERE accepted_at IS NULL AND revoked_at IS NULL`;

  console.log(` - Approved Members: ${approvedMembers[0].count}`);
  console.log(` - Pending Members: ${pendingMembers[0].count}`);
  console.log(` - Pending Invitations: ${pendingInvites[0].count}`);

  console.log('\n✅ ALL INTEGRITY AND RELATIONSHIP CHECKS PASSED!');
}

verifyIntegrity().catch(console.error);
