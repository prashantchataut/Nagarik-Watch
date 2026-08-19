import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text().slice(0, 300)}`)
})
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`))

await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(6000)

const info = await page.evaluate(() => {
  const chrome = document.querySelector('.nw-masthead__chrome')
  const cands = [...(chrome?.querySelectorAll('div') ?? [])].map((d) => ({
    cls: String(d.className).slice(0, 120),
    text: (d.textContent || '').replace(/\u00a0/g, '[nbsp]').trim().slice(0, 60),
    w: Math.round(d.getBoundingClientRect().width),
    display: getComputedStyle(d).display,
  }))
  return {
    chromeDivs: cands,
    hydrated: !!document.querySelector('[data-reactroot], #__next, body')
      && typeof window !== 'undefined',
  }
})

console.log(JSON.stringify({ errors: errors.slice(0, 25), info }, null, 2))
await browser.close()
