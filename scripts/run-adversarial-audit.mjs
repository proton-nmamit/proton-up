import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { v2 as cloudinary } from 'cloudinary';
const VALID_ADMIN_DOMAINS = new Set([
  'proton.cyber',
  'protonnmamit.com',
  'proton.nmamit.in',
  'nmamit.in',
  'proton',
]);

function isValidAdminDomain(domain) {
  return VALID_ADMIN_DOMAINS.has(domain);
}

function getAdminPermissions(email) {
  const norm = (email || '').toLowerCase().trim();
  if (!norm || !norm.includes('@')) {
    return {
      email: norm,
      roleType: 'president',
      roleLabel: 'Member',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: false,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: false,
      canPublishEvents: false,
      canManageGallery: false,
      canManageDesignations: false,
      canManageInvitations: false,
      canViewAuditLogs: false,
    };
  }

  const [localPart, domain] = norm.split('@');
  if (!isValidAdminDomain(domain)) {
    return {
      email: norm,
      roleType: 'president',
      roleLabel: 'Member',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: false,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: false,
      canPublishEvents: false,
      canManageGallery: false,
      canManageDesignations: false,
      canManageInvitations: false,
      canViewAuditLogs: false,
    };
  }

  const isSuper =
    localPart === 'admin' ||
    localPart === 'proton.admin' ||
    localPart === 'superadmin' ||
    localPart === 'super_admin';

  if (isSuper) {
    return {
      email: norm,
      roleType: 'super_admin',
      roleLabel: 'Super Administrator',
      isFullAdmin: true,
      isSuperAdmin: true,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  const isEvents =
    localPart === 'events' ||
    localPart === 'event' ||
    localPart === 'events.manager' ||
    localPart === 'events_manager';

  if (isEvents) {
    return {
      email: norm,
      roleType: 'events_manager',
      roleLabel: 'Events & Gallery Lead',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: true,
      canApproveMembers: false,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: true,
      canPublishEvents: false,
      canManageGallery: true,
      canManageDesignations: false,
      canManageInvitations: false,
      canViewAuditLogs: false,
    };
  }

  const isVP =
    localPart === 'vicepresident' ||
    localPart === 'vice_president' ||
    localPart === 'vp';

  if (isVP) {
    return {
      email: norm,
      roleType: 'vice_president',
      roleLabel: 'Vice President',
      isFullAdmin: false,
      isSuperAdmin: false,
      isVicePresident: true,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: false,
      canDeleteMembers: false,
      canEditMembers: false,
      canManageEvents: false,
      canPublishEvents: false,
      canManageGallery: false,
      canManageDesignations: false,
      canManageInvitations: true,
      canViewAuditLogs: false,
    };
  }

  if (localPart === 'president') {
    return {
      email: norm,
      roleType: 'president',
      roleLabel: 'President',
      isFullAdmin: true,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  if (
    localPart === 'branchcaptain' ||
    localPart === 'branch_captain' ||
    localPart === 'captain'
  ) {
    return {
      email: norm,
      roleType: 'branch_captain',
      roleLabel: 'Branch Captain',
      isFullAdmin: true,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  if (
    localPart === 'tech' ||
    localPart === 'techteam' ||
    localPart === 'tech_team' ||
    localPart === 'technical'
  ) {
    return {
      email: norm,
      roleType: 'tech_head',
      roleLabel: 'Tech Team',
      isFullAdmin: true,
      isSuperAdmin: false,
      isVicePresident: false,
      isEventsManager: false,
      canApproveMembers: true,
      canRevokeMembers: true,
      canDeleteMembers: true,
      canEditMembers: true,
      canManageEvents: true,
      canPublishEvents: true,
      canManageGallery: true,
      canManageDesignations: true,
      canManageInvitations: true,
      canViewAuditLogs: true,
    };
  }

  return {
    email: norm,
    roleType: 'president',
    roleLabel: 'Member',
    isFullAdmin: false,
    isSuperAdmin: false,
    isVicePresident: false,
    isEventsManager: false,
    canApproveMembers: false,
    canRevokeMembers: false,
    canDeleteMembers: false,
    canEditMembers: false,
    canManageEvents: false,
    canPublishEvents: false,
    canManageGallery: false,
    canManageDesignations: false,
    canManageInvitations: false,
    canViewAuditLogs: false,
  };
}

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
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

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const sql = neon(env.DATABASE_URL);

async function runTests() {
  console.log('====================================================');
  console.log('PROTON CMS — ADVERSARIAL SECURITY AUDIT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. RBAC Domain Spoofing Attack Tests
  console.log('--- 1. RBAC & Privilege Resolution Tests ---');
  
  // A. Legitimate Super Admin
  const legitSuper = getAdminPermissions('admin@proton.cyber');
  assert(legitSuper.isSuperAdmin === true && legitSuper.canDeleteMembers === true, 'Legitimate super admin has full permissions');

  // B. Attacker trying to spoof super admin with attacker domain
  const attackerSuper = getAdminPermissions('admin@proton.attacker.com');
  assert(attackerSuper.isSuperAdmin === false && attackerSuper.isFullAdmin === false, 'Attacker spoofing admin@proton.attacker.com is rejected');

  // C. Attacker trying to spoof events manager with attacker domain
  const attackerEvents = getAdminPermissions('events@proton.attacker.com');
  assert(attackerEvents.isEventsManager === false, 'Attacker spoofing events@proton.attacker.com is rejected');

  // D. Attacker trying to spoof VP with attacker domain
  const attackerVP = getAdminPermissions('vp@proton.evil.org');
  assert(attackerVP.isVicePresident === false, 'Attacker spoofing vp@proton.evil.org is rejected');

  // E. Legitimate Events Manager
  const legitEvents = getAdminPermissions('events@proton.cyber');
  assert(legitEvents.isEventsManager === true && legitEvents.canApproveMembers === false && legitEvents.canManageGallery === true, 'Events Manager has strictly scoped permissions');

  // F. Legitimate VP
  const legitVP = getAdminPermissions('vicepresident@proton.cyber');
  assert(legitVP.isVicePresident === true && legitVP.canApproveMembers === true && legitVP.canDeleteMembers === false && legitVP.canRevokeMembers === false, 'Vice President has approval permissions only (no delete/revoke)');

  // 2. Database Integrity Checks
  console.log('\n--- 2. Neon Database Integrity & Asset Checks ---');
  
  // A. Check for any remaining Supabase URLs in public tables
  const supabaseProfiles = await sql`SELECT count(*)::int as count FROM public.profiles WHERE avatar_url LIKE '%supabase.co%'`;
  assert(supabaseProfiles[0].count === 0, 'Zero Supabase avatar URLs remaining in public.profiles');

  const supabaseEvents = await sql`SELECT count(*)::int as count FROM public.events WHERE poster_url LIKE '%supabase.co%'`;
  assert(supabaseEvents[0].count === 0, 'Zero Supabase poster URLs remaining in public.events');

  const supabaseGallery = await sql`SELECT count(*)::int as count FROM public.gallery_images WHERE image_url LIKE '%supabase.co%'`;
  assert(supabaseGallery[0].count === 0, 'Zero Supabase image URLs remaining in public.gallery_images');

  // B. Check Cloudinary Active URLs
  const cloudinaryProfiles = await sql`SELECT count(*)::int as count FROM public.profiles WHERE avatar_url LIKE '%cloudinary.com%'`;
  assert(cloudinaryProfiles[0].count === 19, `All 19 active member profiles have Cloudinary URLs (found ${cloudinaryProfiles[0].count})`);

  const cloudinaryEvents = await sql`SELECT count(*)::int as count FROM public.events WHERE poster_url LIKE '%cloudinary.com%'`;
  assert(cloudinaryEvents[0].count === 8, `All 8 active events have Cloudinary URLs (found ${cloudinaryEvents[0].count})`);

  // C. Check Foreign Keys / Orphan Records
  const orphanedProfiles = await sql`
    SELECT count(*)::int as count FROM public.profiles p
    LEFT JOIN public.designations d ON p.designation_id = d.id
    WHERE p.designation_id IS NOT NULL AND d.id IS NULL
  `;
  assert(orphanedProfiles[0].count === 0, 'Zero orphaned designations in profiles');

  // 3. Cloudinary API Live Connectivity Check
  console.log('\n--- 3. Cloudinary Storage Service Test ---');
  const ping = await cloudinary.api.ping();
  assert(ping.status === 'ok', 'Cloudinary API authenticated ping succeeded');

  // 4. Secret Scan Check
  console.log('\n--- 4. Secret Scan & Environment Check ---');
  assert(!env.NEXT_PUBLIC_CLOUDINARY_API_SECRET, 'NEXT_PUBLIC_CLOUDINARY_API_SECRET is NOT set');
  assert(!env.NEXT_PUBLIC_DATABASE_URL, 'NEXT_PUBLIC_DATABASE_URL is NOT set');
  assert(!env.NEXT_PUBLIC_RESEND_API_KEY, 'NEXT_PUBLIC_RESEND_API_KEY is NOT set');
  assert(!env.NEXT_PUBLIC_BETTER_AUTH_SECRET, 'NEXT_PUBLIC_BETTER_AUTH_SECRET is NOT set');

  console.log(`\n====================================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
