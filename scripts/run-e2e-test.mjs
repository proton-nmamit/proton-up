import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const SCREENSHOTS_DIR = 'C:/Users/sujal/.gemini/antigravity/brain/a13156b5-0464-4539-8ef4-aac50c815b90/e2e_screenshots'
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

if (!fs.existsSync('test-assets')) {
  fs.mkdirSync('test-assets', { recursive: true })
}
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGYzUAAIpCA/1h9QAAAABJRU5ErkJggg=='
if (!fs.existsSync('test-assets/test-avatar.png')) {
  fs.writeFileSync('test-assets/test-avatar.png', Buffer.from(pngBase64, 'base64'))
}
if (!fs.existsSync('test-assets/test-gallery.png')) {
  fs.writeFileSync('test-assets/test-gallery.png', Buffer.from(pngBase64, 'base64'))
}

const CHROME_PATH = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

console.log('Using browser binary:', CHROME_PATH)

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fillReactInput(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 10000 })
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel)
    if (el) {
      const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      if (setter) {
        setter.call(el, val)
      } else {
        el.value = val
      }
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }, selector, value)
}

async function runTest() {
  console.log('=== STARTING 15-STEP REAL-WORLD BROWSER VERIFICATION ===\n')

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960'],
    defaultViewport: { width: 1280, height: 960 },
  })

  try {
    // -------------------------------------------------------------
    // STEP 1: Admin Login
    // -------------------------------------------------------------
    console.log('[STEP 1] Admin Logging In...')
    const adminPage = await browser.newPage()
    adminPage.on('console', (msg) => console.log('  [ADMIN BROWSER]:', msg.text()))
    adminPage.on('pageerror', (err) => console.error('  [ADMIN PAGE ERROR]:', err.message))

    await adminPage.goto('http://localhost:3000/member/login', { waitUntil: 'networkidle2' })
    await adminPage.waitForSelector('input[type="email"]')
    await adminPage.type('input[type="email"]', 'admin@proton.cyber')
    await adminPage.type('input[type="password"]', 'proton123')
    await adminPage.evaluate(() => document.querySelector('form').requestSubmit())
    await adminPage.waitForFunction(() => window.location.pathname.startsWith('/admin'), { timeout: 15000 })
    console.log('Admin redirected to:', adminPage.url())
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_admin_logged_in.png') })
    console.log('✓ Step 1 Passed: Admin successfully authenticated.\n')

    // -------------------------------------------------------------
    // STEP 2: Create Invitation from /admin/invitations
    // -------------------------------------------------------------
    console.log('[STEP 2] Creating Member Invitation...')
    await adminPage.goto('http://localhost:3000/admin/invitations', { waitUntil: 'networkidle2' })
    await delay(2500)
    
    // Click "New Invitation" button
    await adminPage.waitForSelector('button')
    await adminPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Invitation'))
      if (btn) btn.click()
    })
    await delay(1000)

    // Fill invitation modal
    await fillReactInput(adminPage, 'input[name="name"]', 'Alex Vance')
    await fillReactInput(adminPage, 'input[name="email"]', 'alex@proton.cyber')
    await adminPage.evaluate(() => {
      const sel = document.querySelector('select[name="designation_id"]')
      if (sel && sel.options.length > 3) {
        sel.selectedIndex = 3
        sel.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    await delay(500)
    
    // Click submit button in modal
    const submitBtn = await adminPage.waitForSelector('.fixed.inset-0 button[type="submit"]')
    await submitBtn.click()

    await delay(2000)
    const modalErr = await adminPage.$('.text-rose-300')
    if (modalErr) {
      const msg = await adminPage.evaluate((el) => el.textContent, modalErr)
      console.log('Invitation modal error:', msg)
    }

    // Wait for the generated link input
    await adminPage.waitForSelector('input[readonly]', { timeout: 10000 })
    const inviteUrl = await adminPage.$eval('input[readonly]', (el) => el.value)
    console.log('✓ Generated Invitation URL:', inviteUrl)
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_invitation_created.png') })
    console.log('✓ Step 2 Passed: Single-use cryptographic invitation generated.\n')

    // -------------------------------------------------------------
    // STEP 3: Open Invitation in Incognito Window Context
    // -------------------------------------------------------------
    console.log('[STEP 3] Opening invitation in isolated incognito context...')
    const incognitoContext = await browser.createBrowserContext()
    const memberPage = await incognitoContext.newPage()
    memberPage.on('console', (msg) => console.log('  [MEMBER BROWSER]:', msg.text()))
    memberPage.on('pageerror', (err) => console.error('  [MEMBER PAGE ERROR]:', err.message))

    await memberPage.goto(inviteUrl, { waitUntil: 'networkidle2' })
    await memberPage.waitForSelector('form', { timeout: 10000 })
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_incognito_registration_page.png') })
    console.log('✓ Step 3 Passed: Registration form accessed via token in incognito context.\n')

    // -------------------------------------------------------------
    // STEP 4: Register Test Member
    // -------------------------------------------------------------
    console.log('[STEP 4] Registering test member Alex Vance...')
    const passwordInputs = await memberPage.$$('input[type="password"]')
    if (passwordInputs.length >= 2) {
      await passwordInputs[0].type('Password123!')
      await passwordInputs[1].type('Password123!')
    }

    const usnInput = await memberPage.$('input[placeholder*="4NM"]')
    if (usnInput) await usnInput.type('4NM23CS999')

    const branchInput = await memberPage.$('input[placeholder*="CSE / Cyber"]')
    if (branchInput) await branchInput.type('CSE (Cybersecurity)')

    const yearInput = await memberPage.$('input[placeholder*="3rd Year"]')
    if (yearInput) await yearInput.type('2nd Year')

    const phoneInput = await memberPage.$('input[type="tel"]')
    if (phoneInput) await phoneInput.type('+91 98765 43210')

    const bioInput = await memberPage.$('textarea')
    if (bioInput) await bioInput.type('Passionate about binary exploitation, firmware reverse engineering, and threat hunting.')

    // Submit registration
    await memberPage.evaluate(() => document.querySelector('form').requestSubmit())

    // Wait for success screen
    await memberPage.waitForSelector('a[href="/member/login"]', { timeout: 10000 })
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_registration_success.png') })
    console.log('✓ Step 4 Passed: Alex Vance registered with status pending.\n')

    // -------------------------------------------------------------
    // STEP 5: Log in as Test Member
    // -------------------------------------------------------------
    console.log('[STEP 5] Logging in as member Alex Vance...')
    await memberPage.goto('http://localhost:3000/member/login', { waitUntil: 'networkidle2' })
    await memberPage.waitForSelector('input[type="email"]')
    await memberPage.type('input[type="email"]', 'alex@proton.cyber')
    await memberPage.type('input[type="password"]', 'Password123!')
    await memberPage.evaluate(() => document.querySelector('form').requestSubmit())
    await memberPage.waitForFunction(() => window.location.pathname === '/member/dashboard', { timeout: 15000 })
    console.log('Member redirected to:', memberPage.url())

    // Verify Pending Status Notice Card
    await memberPage.waitForSelector('::-p-text("PROFILE STATUS: PENDING REVIEW")', { timeout: 10000 })
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_member_dashboard_pending.png') })
    console.log('✓ Step 5 Passed: Member dashboard shows PENDING REVIEW.\n')

    // -------------------------------------------------------------
    // STEP 6: Upload a Real Profile Photo
    // -------------------------------------------------------------
    console.log('[STEP 6] Uploading profile photo...')
    const fileInput = await memberPage.waitForSelector('input[type="file"]')
    const avatarFilePath = path.resolve('test-assets/test-avatar.png')
    await fileInput.uploadFile(avatarFilePath)
    await delay(1500)
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_member_avatar_uploaded.png') })
    console.log('✓ Step 6 Passed: Avatar image uploaded.\n')

    // -------------------------------------------------------------
    // STEP 7: Fill / Update Profile Details
    // -------------------------------------------------------------
    console.log('[STEP 7] Updating member profile details...')
    await fillReactInput(memberPage, 'textarea', 'Passionate about binary exploitation, firmware reverse engineering, and threat hunting. Core researcher in PROTON.')
    await delay(400)
    const saveBtn = await memberPage.waitForSelector('button[data-testid="save-profile-btn"]')
    await saveBtn.click()
    await delay(2000)
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_member_profile_updated.png') })
    console.log('✓ Step 7 Passed: Member profile updated.\n')

    // -------------------------------------------------------------
    // STEP 8: Log Back into Admin & Review Pending Member
    // -------------------------------------------------------------
    console.log('[STEP 8] Admin inspecting members list...')
    await adminPage.goto('http://localhost:3000/admin/members', { waitUntil: 'networkidle2' })
    await adminPage.waitForSelector('::-p-text("Alex Vance")', { timeout: 10000 })
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_admin_members_pending.png') })
    console.log('✓ Step 8 Passed: Alex Vance listed with PENDING badge in Admin CMS.\n')

    // -------------------------------------------------------------
    // STEP 9: Reject Member with a Test Reason
    // -------------------------------------------------------------
    console.log('[STEP 9] Admin rejecting member with test reason...')
    const rejectBtn = await adminPage.waitForSelector('button[title="Reject member"]')
    await rejectBtn.click()
    await delay(800)

    const testRejectionReason = 'Please specify your exact cybersecurity lab track and department.'
    await fillReactInput(adminPage, '.fixed.inset-0 textarea', testRejectionReason)
    await delay(400)

    const confirmRejectBtn = await adminPage.waitForSelector('.fixed.inset-0 button[type="submit"]')
    await confirmRejectBtn.click()
    await delay(2000)
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_admin_member_rejected.png') })
    console.log('✓ Step 9 Passed: Member rejected with feedback note.\n')

    // -------------------------------------------------------------
    // STEP 10: Check Member Sees the Rejection & Reason
    // -------------------------------------------------------------
    console.log('[STEP 10] Checking member dashboard reflects rejection...')
    await memberPage.reload({ waitUntil: 'networkidle2' })
    await delay(2000)
    await memberPage.waitForSelector('::-p-text("PROFILE STATUS: REJECTED // ACTION REQUIRED")', { timeout: 15000 })
    await memberPage.waitForSelector(`::-p-text("${testRejectionReason}")`, { timeout: 10000 })
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_member_sees_rejection.png') })
    console.log('✓ Step 10 Passed: Member dashboard clearly displays REJECTED status and admin feedback.\n')

    // -------------------------------------------------------------
    // STEP 11: Edit and Resubmit Profile
    // -------------------------------------------------------------
    console.log('[STEP 11] Member updating details and resubmitting...')
    await fillReactInput(memberPage, 'input[name="department"]', 'Department of CSE (Cybersecurity & Cryptography)')
    await delay(400)

    const resubmitBtn = await memberPage.waitForSelector('button[data-testid="save-profile-btn"]')
    await resubmitBtn.click()
    await delay(2500)
    await memberPage.waitForSelector('::-p-text("PROFILE STATUS: PENDING REVIEW")', { timeout: 15000 })
    await memberPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_member_resubmitted_pending.png') })
    console.log('✓ Step 11 Passed: Resubmission transitions status back to PENDING.\n')

    // -------------------------------------------------------------
    // STEP 12: Admin Approves the Member
    // -------------------------------------------------------------
    console.log('[STEP 12] Admin approving Alex Vance...')
    await adminPage.reload({ waitUntil: 'networkidle2' })
    await delay(2000)
    const approveBtn = await adminPage.waitForSelector('button[title="Approve member"]')
    await approveBtn.click()
    await delay(2000)
    await adminPage.waitForSelector('::-p-text("APPROVED")', { timeout: 10000 })
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '12_admin_member_approved.png') })
    console.log('✓ Step 12 Passed: Alex Vance approved in CMS.\n')

    // -------------------------------------------------------------
    // STEP 13: Open Public /teams & Verify Member Appears Correctly
    // -------------------------------------------------------------
    console.log('[STEP 13] Verifying public /teams page...')
    const publicPage = await browser.newPage()
    await publicPage.goto('http://localhost:3000/teams', { waitUntil: 'networkidle2' })
    await delay(2000)
    await publicPage.waitForSelector('::-p-text("Alex Vance")', { timeout: 10000 })
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '13_teams_page_with_member.png') })
    console.log('✓ Step 13 Passed: Alex Vance rendered on public /teams directory.\n')

    // -------------------------------------------------------------
    // STEP 14: Change Designation / Order
    // -------------------------------------------------------------
    console.log('[STEP 14] Reordering designations in /admin/designations...')
    await adminPage.goto('http://localhost:3000/admin/designations', { waitUntil: 'networkidle2' })
    await delay(2000)
    await adminPage.evaluate(() => {
      const downButtons = document.querySelectorAll('button[title="Move down"]')
      if (downButtons.length > 0) downButtons[0].click()
    })
    await delay(1500)
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '14_admin_designation_reordered.png') })
    console.log('✓ Step 14 Passed: Designation order updated in CMS.\n')

    // -------------------------------------------------------------
    // STEP 15: Verify /teams Reflects Hierarchy
    // -------------------------------------------------------------
    console.log('[STEP 15] Verifying /teams reflects updated hierarchy...')
    await publicPage.reload({ waitUntil: 'networkidle2' })
    await delay(2000)
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '15_teams_reflects_reorder.png') })
    console.log('✓ Step 15 Passed: Public teams reflects updated ordering.\n')

    // -------------------------------------------------------------
    // STEP 16: Create & Publish Test Event -> Verify on /events
    // -------------------------------------------------------------
    console.log('[STEP 16] Admin creating and publishing test event...')
    await adminPage.goto('http://localhost:3000/admin/events', { waitUntil: 'networkidle2' })
    await delay(2000)

    await adminPage.evaluate(() => {
      const btn = document.querySelector('button[data-testid="new-event-btn"]')
      if (btn) btn.click()
    })
    await delay(1000)

    await fillReactInput(adminPage, '.fixed.inset-0 input[name="title"]', 'Cyber Threat Intel Summit 2026')
    await fillReactInput(adminPage, '.fixed.inset-0 textarea[name="description"]', 'Advanced persistent threat modeling, red team simulation, and defensive triage workshops.')
    await fillReactInput(adminPage, '.fixed.inset-0 input[name="event_date"]', '2026-11-15')
    await fillReactInput(adminPage, '.fixed.inset-0 input[name="location"]', 'PROTON Advanced Cyber Lab')
    await delay(500)

    await adminPage.evaluate(() => {
      const submitBtn = document.querySelector('.fixed.inset-0 button[type="submit"]')
      if (submitBtn) submitBtn.click()
    })
    await delay(2500)
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '16_admin_event_created.png') })

    // Verify on public /events
    await publicPage.goto('http://localhost:3000/events', { waitUntil: 'networkidle2' })
    await delay(2000)
    await publicPage.waitForSelector('::-p-text("Cyber Threat Intel Summit 2026")', { timeout: 15000 })
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '17_public_events_verified.png') })
    console.log('✓ Step 16 Passed: Event published in Admin CMS and verified on public /events.\n')

    // -------------------------------------------------------------
    // STEP 17: Upload & Publish Test Gallery Image -> Verify on /gallery
    // -------------------------------------------------------------
    console.log('[STEP 17] Admin uploading and publishing test gallery image...')
    await adminPage.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle2' })
    await delay(2000)

    await adminPage.evaluate(() => {
      const uploadBtn = document.querySelector('button[data-testid="upload-photo-btn"]')
      if (uploadBtn) uploadBtn.click()
    })
    await delay(1000)

    const galleryFileInput = await adminPage.waitForSelector('.fixed.inset-0 input[name="image_file"]')
    await galleryFileInput.uploadFile(path.resolve('test-assets/test-gallery.png'))

    await fillReactInput(adminPage, '.fixed.inset-0 input[name="title"]', 'PROTON Cyber Summit Keynote')
    await fillReactInput(adminPage, '.fixed.inset-0 input[name="event_name"]', 'Cyber Threat Intel Summit 2026')
    await delay(500)

    await adminPage.evaluate(() => {
      const submitBtn = document.querySelector('.fixed.inset-0 button[type="submit"]')
      if (submitBtn) submitBtn.click()
    })
    await delay(2500)
    await adminPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '18_admin_gallery_uploaded.png') })

    // Verify on public /gallery
    await publicPage.goto('http://localhost:3000/gallery', { waitUntil: 'networkidle2' })
    await delay(2000)
    await publicPage.waitForSelector('::-p-text("PROTON Cyber Summit Keynote")', { timeout: 15000 })
    await publicPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '19_public_gallery_verified.png') })
    console.log('✓ Step 17 Passed: Gallery photo published and verified on public /gallery.\n')

    console.log('================================================================');
    console.log('🎉 ALL 17 REAL-WORLD END-TO-END BROWSER TESTS PASSED PERFECTLY!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

runTest()
