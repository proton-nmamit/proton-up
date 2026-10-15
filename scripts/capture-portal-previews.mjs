import puppeteer from 'puppeteer-core'
import fs from 'fs'

const chromePath = fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  // Navbar on Home
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' })
  await page.screenshot({ path: 'C:/Users/sujal/.gemini/antigravity/brain/a13156b5-0464-4539-8ef4-aac50c815b90/e2e_screenshots/20_navbar_with_portal_login.png' })
  
  // Footer on Home
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise(r => setTimeout(r, 1000))
  await page.screenshot({ path: 'C:/Users/sujal/.gemini/antigravity/brain/a13156b5-0464-4539-8ef4-aac50c815b90/e2e_screenshots/21_footer_with_signup_info.png' })

  // Teams Page
  await page.goto('http://localhost:3000/teams', { waitUntil: 'networkidle2' })
  await page.screenshot({ path: 'C:/Users/sujal/.gemini/antigravity/brain/a13156b5-0464-4539-8ef4-aac50c815b90/e2e_screenshots/22_teams_member_portal_banner.png' })

  // Login Page with Sign Up Steps
  await page.goto('http://localhost:3000/member/login', { waitUntil: 'networkidle2' })
  await page.screenshot({ path: 'C:/Users/sujal/.gemini/antigravity/brain/a13156b5-0464-4539-8ef4-aac50c815b90/e2e_screenshots/23_login_page_signup_protocol.png' })

  await browser.close()
  console.log('ALL PREVIEWS CAPTURED SUCCESSFULLY!')
}

run().catch(console.error)
