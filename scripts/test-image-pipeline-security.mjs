import sharp from 'sharp'
import { validateMagicBytes, sanitizeAndConvertToWebP } from '../lib/storage/image-processor.ts'
import { sanitizePathSegment, extractCloudinaryPublicId, STORAGE_PRESETS } from '../lib/storage/cloudinary.ts'

async function runSecurityTests() {
  console.log('='.repeat(60))
  console.log('PROTON CMS — IMAGE SECURITY & STORAGE HARDENING TEST SUITE')
  console.log('='.repeat(60))

  let passed = 0
  let failed = 0

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`[PASS] ${name}${details ? ` -> ${details}` : ''}`)
      passed++
    } else {
      console.error(`[FAIL] ${name}${details ? ` -> ${details}` : ''}`)
      failed++
    }
  }

  // 1. Magic byte verification on valid JPEG
  const rawJpeg = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 208, b: 90 } }
  }).jpeg().toBuffer()
  const jpegCheck = validateMagicBytes(rawJpeg)
  assert(jpegCheck.valid && jpegCheck.format === 'jpeg', 'Valid JPEG magic bytes detected', `detected: ${jpegCheck.format}`)

  // 2. Magic byte verification on valid PNG
  const rawPng = await sharp({
    create: { width: 100, height: 100, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } }
  }).png().toBuffer()
  const pngCheck = validateMagicBytes(rawPng)
  assert(pngCheck.valid && pngCheck.format === 'png', 'Valid PNG magic bytes detected', `detected: ${pngCheck.format}`)

  // 3. Magic byte verification on valid WebP
  const rawWebp = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } }
  }).webp().toBuffer()
  const webpCheck = validateMagicBytes(rawWebp)
  assert(webpCheck.valid && webpCheck.format === 'webp', 'Valid WebP magic bytes detected', `detected: ${webpCheck.format}`)

  // 4. Malicious PHP disguised as image
  const maliciousPhp = Buffer.from('<?php echo "EXPLOIT_PAYLOAD"; system($_GET["cmd"]); ?>')
  const phpCheck = validateMagicBytes(maliciousPhp)
  assert(!phpCheck.valid, 'Malicious PHP file disguised as image is rejected', phpCheck.error)

  // 5. Malicious HTML/SVG/XSS payload disguised as image
  const maliciousHtml = Buffer.from('<!DOCTYPE html><html><body><script>alert("XSS")</script></body></html>')
  const htmlCheck = validateMagicBytes(maliciousHtml)
  assert(!htmlCheck.valid, 'HTML/XSS disguised payload is rejected', htmlCheck.error)

  const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle cx="50" cy="50" r="40"/></svg>')
  const svgCheck = validateMagicBytes(maliciousSvg)
  assert(!svgCheck.valid, 'SVG payload is rejected by magic byte validator', svgCheck.error)

  // 6. Full pipeline sanitize and re-encode to WebP
  const sanitizedResult = await sanitizeAndConvertToWebP(rawJpeg, {
    maxPixels: 20_000_000,
    maxWidth: 2400,
    maxHeight: 2400,
    quality: 85,
  })
  assert(sanitizedResult.success && sanitizedResult.format === 'webp', 'JPEG converted to pure WebP', `Dimensions: ${sanitizedResult.width}x${sanitizedResult.height}`)

  const resultMagic = validateMagicBytes(sanitizedResult.buffer)
  assert(resultMagic.valid && resultMagic.format === 'webp', 'Converted buffer is verified WebP binary')

  // 7. Malicious payload passed to full pipeline fails cleanly
  const maliciousPipelineResult = await sanitizeAndConvertToWebP(maliciousPhp)
  assert(!maliciousPipelineResult.success, 'Malicious payload failed full pipeline processing')

  // 8. Pixel bomb / excessive dimension defense
  const hugeImage = await sharp({
    create: { width: 2500, height: 2500, channels: 3, background: { r: 0, g: 0, b: 0 } }
  }).jpeg().toBuffer()
  const bombCheck = await sanitizeAndConvertToWebP(hugeImage, {
    maxWidth: 1000,
    maxHeight: 1000,
    maxPixels: 1_000_000,
  })
  assert(!bombCheck.success, 'Excessive dimension/pixel image rejected', bombCheck.error)

  // 9. Path traversal protection in sanitizePathSegment
  const traversal1 = sanitizePathSegment('../../etc/passwd')
  assert(traversal1 === 'etc/passwd' && !traversal1.includes('..'), 'Path traversal (../../etc/passwd) sanitized', `Output: ${traversal1}`)

  const traversal2 = sanitizePathSegment('..\\..\\windows\\system32')
  assert(traversal2 === 'windows/system32' && !traversal2.includes('..'), 'Windows path traversal sanitized', `Output: ${traversal2}`)

  const nullByteTraversal = sanitizePathSegment('evil\0avatar..')
  assert(!nullByteTraversal.includes('\0') && !nullByteTraversal.includes('..'), 'Null byte and parent ref sanitized', `Output: ${nullByteTraversal}`)

  // 10. Namespace isolation in extractCloudinaryPublicId
  const validProtonUrl = 'https://res.cloudinary.com/ddugleiyp/image/upload/v1727638492/proton/members/avatars/user123.webp'
  const extractedId = extractCloudinaryPublicId(validProtonUrl)
  assert(extractedId === 'proton/members/avatars/user123', 'Valid proton namespace public ID extracted', `Extracted: ${extractedId}`)

  const externalUrl = 'https://res.cloudinary.com/ddugleiyp/image/upload/v1727638492/other_project/secret_file.jpg'
  const externalExtracted = extractCloudinaryPublicId(externalUrl)
  assert(externalExtracted === null, 'Non-proton external namespace asset is blocked from deletion', `Result: ${externalExtracted}`)

  const maliciousUrl = 'https://evil.com/hack.jpg'
  const evilExtracted = extractCloudinaryPublicId(maliciousUrl)
  assert(evilExtracted === null, 'Third-party arbitrary URL is rejected', `Result: ${evilExtracted}`)

  // 11. Storage Presets integrity
  assert(STORAGE_PRESETS.MEMBER_AVATARS.folder === 'proton/members/avatars', 'Member avatar folder preset correct')
  assert(STORAGE_PRESETS.EVENT_POSTERS.folder === 'proton/events/posters', 'Event poster folder preset correct')
  assert(STORAGE_PRESETS.GALLERY_IMAGES.folder === 'proton/gallery', 'Gallery images folder preset correct')

  console.log('='.repeat(60))
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`)
  console.log('='.repeat(60))

  if (failed > 0) {
    process.exit(1)
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
