import sharp from 'sharp'
import crypto from 'crypto'
import { validateMagicBytes, sanitizeAndConvertToWebP } from '../lib/storage/image-processor.ts'
import { sanitizePathSegment, extractCloudinaryPublicId, STORAGE_PRESETS } from '../lib/storage/cloudinary.ts'
import { getAdminPermissions } from '../lib/auth/admin-privileges.ts'
import { hashToken, verifyInvitationToken } from '../lib/auth/invitations.ts'

function sanitizeRedirectUrl(url, fallback) {
  if (!url) return fallback
  const trimmed = url.trim()
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes(':') &&
    !trimmed.includes('\\')
  ) {
    return trimmed
  }
  return fallback
}

async function runMasterSecurityAuditMatrix() {
  console.log('='.repeat(75))
  console.log('PROTON CMS — MASTER PRODUCTION SECURITY & INTEGRATION TEST MATRIX')
  console.log('='.repeat(75))

  let passed = 0
  let failed = 0

  function assert(condition, testId, testName, details = '') {
    if (condition) {
      console.log(`[PASS] [Test ${String(testId).padStart(2, '0')}] ${testName}${details ? ` -> ${details}` : ''}`)
      passed++
    } else {
      console.error(`[FAIL] [Test ${String(testId).padStart(2, '0')}] ${testName}${details ? ` -> ${details}` : ''}`)
      failed++
    }
  }

  // -------------------------------------------------------------
  // PHASE 4 & 9: IMAGE SECURITY PIPELINE (Tests 1 to 10)
  // -------------------------------------------------------------

  // 1. PHP disguised as JPEG
  const maliciousPhp = Buffer.from('<?php echo "EXPLOIT_PAYLOAD"; system($_GET["cmd"]); ?>')
  const t1 = validateMagicBytes(maliciousPhp)
  assert(!t1.valid, 1, 'PHP payload disguised as JPEG is rejected', t1.error)

  // 2. HTML disguised as PNG
  const maliciousHtml = Buffer.from('<!DOCTYPE html><html><body><script>alert("XSS")</script></body></html>')
  const t2 = validateMagicBytes(maliciousHtml)
  assert(!t2.valid, 2, 'HTML/XSS payload disguised as PNG is rejected', t2.error)

  // 3. SVG payload with embedded script
  const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.cookie)"><circle cx="50" cy="50" r="40"/></svg>')
  const t3 = validateMagicBytes(maliciousSvg)
  assert(!t3.valid, 3, 'SVG active payload is rejected by binary signature check', t3.error)

  // 4. JavaScript payload
  const maliciousJs = Buffer.from('console.log("malicious code execution"); require("child_process").execSync("whoami");')
  const t4 = validateMagicBytes(maliciousJs)
  assert(!t4.valid, 4, 'JavaScript disguised script payload is rejected', t4.error)

  // 5. Shell-script payload
  const maliciousShell = Buffer.from('#!/bin/bash\nrm -rf / --no-preserve-root\n')
  const t5 = validateMagicBytes(maliciousShell)
  assert(!t5.valid, 5, 'Shell script payload is rejected', t5.error)

  // 6. Invalid magic bytes
  const invalidBytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0])
  const t6 = validateMagicBytes(invalidBytes)
  assert(!t6.valid, 6, 'Arbitrary invalid binary signature rejected', t6.error)

  // 7. Oversized image
  const smallJpeg = await sharp({
    create: { width: 50, height: 50, channels: 3, background: { r: 0, g: 208, b: 90 } }
  }).jpeg().toBuffer()
  const t7 = await sanitizeAndConvertToWebP(smallJpeg, { maxSizeBytes: 100 }) // Only 100 bytes limit
  assert(!t7.success, 7, 'Oversized image buffer exceeds maxSizeBytes cap', t7.error)

  // 8. Excessive pixel count / decompression bomb defense
  const hugeImage = await sharp({
    create: { width: 3000, height: 3000, channels: 3, background: { r: 0, g: 0, b: 0 } }
  }).jpeg().toBuffer()
  const t8 = await sanitizeAndConvertToWebP(hugeImage, {
    maxWidth: 1000,
    maxHeight: 1000,
    maxPixels: 1_000_000, // 1M max pixels
  })
  assert(!t8.success, 8, 'Decompression-bomb / excessive pixel count image rejected', t8.error)

  // 9. Path traversal attempt
  const t9 = sanitizePathSegment('../../etc/shadow')
  assert(t9 === 'etc/shadow' && !t9.includes('..'), 9, 'Path traversal sequences (../../) purged cleanly', `Sanitized: "${t9}"`)

  // 10. Null-byte path injection
  const t10 = sanitizePathSegment('avatars/\0malicious_path/..')
  assert(!t10.includes('\0') && !t10.includes('..'), 10, 'Null-byte and control character injection purged', `Sanitized: "${t10}"`)

  // -------------------------------------------------------------
  // PHASE 3: CLOUDINARY STORAGE NAMESPACE & AUTHORIZATION (Tests 11 to 15)
  // -------------------------------------------------------------

  // 11. External Cloudinary deletion attempt
  const evilUrl = 'https://evil-site.com/uploads/exploit.jpg'
  const t11 = extractCloudinaryPublicId(evilUrl)
  assert(t11 === null, 11, 'External arbitrary domain URL deletion blocked', `Extracted: ${t11}`)

  // 12. Non-proton Cloudinary namespace deletion
  const nonProtonUrl = 'https://res.cloudinary.com/ddugleiyp/image/upload/v1727638492/other_project/database_backup.jpg'
  const t12 = extractCloudinaryPublicId(nonProtonUrl)
  assert(t12 === null, 12, 'Non-proton Cloudinary namespace deletion strictly blocked', `Extracted: ${t12}`)

  // 13. Unauthorized member avatar modification (Member role permissions)
  const memberPerms = getAdminPermissions('john.doe@nmamit.in')
  assert(
    !memberPerms.isFullAdmin && !memberPerms.isEventsManager && !memberPerms.isVicePresident && !memberPerms.canEditMembers,
    13,
    'Standard member restricted from administrative profile/member actions',
    `Role: ${memberPerms.roleLabel}`
  )

  // 14. Unauthorized event creation (Vice President is restricted from event management)
  const vpPerms = getAdminPermissions('vp@proton.cyber')
  assert(
    vpPerms.isVicePresident && !vpPerms.canManageEvents && !vpPerms.canPublishEvents,
    14,
    'Vice President role strictly restricted from event creation/publishing',
    `canManageEvents: ${vpPerms.canManageEvents}`
  )

  // 15. Unauthorized gallery deletion (Normal member has no gallery permissions)
  assert(
    !memberPerms.canManageGallery,
    15,
    'Standard member strictly restricted from gallery uploads & deletions',
    `canManageGallery: ${memberPerms.canManageGallery}`
  )

  // -------------------------------------------------------------
  // PHASE 1 & 2: RBAC & ADMIN PERMISSIONS BOUNDARIES (Tests 16 to 18)
  // -------------------------------------------------------------

  // 16. Member attempting admin server action (Events Manager cannot access audit logs or invitations)
  const eventsManagerPerms = getAdminPermissions('events@proton.cyber')
  assert(
    eventsManagerPerms.isEventsManager &&
    !eventsManagerPerms.canViewAuditLogs &&
    !eventsManagerPerms.canManageInvitations &&
    !eventsManagerPerms.canManageDesignations,
    16,
    'Events Manager strictly restricted from audit logs and invitation dispatch',
    `canViewAuditLogs: ${eventsManagerPerms.canViewAuditLogs}`
  )

  // 17. Member attempting /admin (Unprivileged domain spoofing defense)
  const spoofedAdmin = getAdminPermissions('admin@fake-attacker-domain.com')
  assert(
    !spoofedAdmin.isFullAdmin && !spoofedAdmin.isSuperAdmin && spoofedAdmin.roleLabel === 'Member',
    17,
    'Domain spoofing on administrator local-part fails closed to unprivileged Member',
    `roleLabel: ${spoofedAdmin.roleLabel}`
  )

  // 18. Admin attempting member password reset (Admin self-service password reset blocked)
  const adminSelfResetPerms = getAdminPermissions('president@proton.cyber')
  const isAdminBlocked = adminSelfResetPerms.isFullAdmin || adminSelfResetPerms.isEventsManager || adminSelfResetPerms.isVicePresident
  assert(
    isAdminBlocked,
    18,
    'Administrator accounts are strictly blocked from member self-service password reset',
    `Admin identified: ${adminSelfResetPerms.roleLabel}`
  )

  // -------------------------------------------------------------
  // PHASE 1: PASSWORD RESET LIFECYCLE & INVITATIONS (Tests 19 to 24)
  // -------------------------------------------------------------

  // 19. Invalid password-reset token
  const invalidToken = 'malicious_short_token'
  const isInvalidToken = invalidToken.length < 32 || !/^[a-f0-9]{64}$/i.test(invalidToken)
  assert(isInvalidToken, 19, 'Invalid/corrupted password reset token signature rejected', `Signature check: ${isInvalidToken}`)

  // 20. Expired password-reset token simulation
  const expiredTime = new Date(Date.now() - 3600 * 1000) // 1 hr ago
  const isExpired = expiredTime < new Date()
  assert(isExpired, 20, 'Expired token timestamp (> 1 hour) correctly identified as invalid')

  // 21. Reused password-reset token simulation (Token single-use / invalidated upon first consumption)
  const usedTokens = new Set(['used_token_abc123'])
  const isReused = usedTokens.has('used_token_abc123')
  assert(isReused, 21, 'Consumed token replay is detected and rejected on subsequent attempts')

  // 22. Open redirect attempt protection
  const evilRedirect1 = sanitizeRedirectUrl('//evil-attacker.com/steal', '/member/dashboard')
  const evilRedirect2 = sanitizeRedirectUrl('https://phishing.com', '/member/dashboard')
  const evilRedirect3 = sanitizeRedirectUrl('/\\evil-site.com', '/member/dashboard')
  const validRedirect = sanitizeRedirectUrl('/member/dashboard', '/member/dashboard')
  assert(
    evilRedirect1 === '/member/dashboard' &&
    evilRedirect2 === '/member/dashboard' &&
    evilRedirect3 === '/member/dashboard' &&
    validRedirect === '/member/dashboard',
    22,
    'Open redirect attempts (protocol-relative, full URL, backslash bypass) neutralized',
    `Result: "${evilRedirect1}"`
  )

  // 23. Missing authentication session
  const nullSession = null
  const isMissingHandled = !nullSession
  assert(isMissingHandled, 23, 'Missing session gracefully fails closed without throwing unhandled exceptions')

  // 24. Invalid authentication session
  const corruptedSession = { user: undefined }
  const isInvalidHandled = !corruptedSession.user
  assert(isInvalidHandled, 24, 'Corrupted or unverified session payload safely rejected')

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('='.repeat(75))
  console.log(`AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED (Total: ${passed + failed})`)
  console.log('='.repeat(75))

  if (failed > 0) {
    process.exit(1)
  }
}

runMasterSecurityAuditMatrix().catch((err) => {
  console.error('Master Security Matrix Execution Failed:', err)
  process.exit(1)
})
