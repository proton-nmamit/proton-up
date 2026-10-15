async function check() {
  try {
    const res = await fetch('http://localhost:3000/member/login')
    const html = await res.text()
    console.log('Status:', res.status)
    console.log('Length:', html.length)
    console.log('Has type="email":', html.includes('type="email"'))
    console.log('Title:', html.match(/<title>.*?<\/title>/)?.[0])
    if (html.includes('error') || html.includes('Error')) {
      console.log('Error snippet:', html.slice(0, 1000))
    }
  } catch (e) {
    console.error('Fetch error:', e)
  }
}
check()
