import puppeteer from 'puppeteer-core'

async function test() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
  })
  const page = await browser.newPage()
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', err => console.log('PAGE ERROR:', err))

  await page.goto('http://localhost:3000/member/login', { waitUntil: 'networkidle2' })
  await new Promise(r => setTimeout(r, 1000))

  await page.type('input[type="email"]', 'admin@proton.cyber')
  await page.type('input[type="password"]', 'proton123')

  console.log('Typed in credentials')
  await page.evaluate(() => {
    const form = document.querySelector('form')
    if (form) form.requestSubmit()
    else console.log('No form found!')
  })
  console.log('Triggered form.requestSubmit()')

  await new Promise(r => setTimeout(r, 3000))
  const errEl = await page.$('.text-rose-300')
  if (errEl) {
    console.log('Error text:', await page.evaluate(el => el.textContent, errEl))
  }
  console.log('Current URL:', page.url())

  await browser.close()
}

test()
