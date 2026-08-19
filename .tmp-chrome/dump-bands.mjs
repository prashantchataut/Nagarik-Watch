import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 })
await page.waitForTimeout(4000)

const dump = await page.evaluate(() => {
  const main = document.querySelector('main')
  const mainTop = main ? main.getBoundingClientRect().top : 9999

  // Every leaf-ish text node above main, with position
  const rows = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = walker.nextNode())) {
    const text = (n.textContent || '').trim()
    if (!text) continue
    const el = n.parentElement
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top >= mainTop || r.height === 0) continue
    rows.push({
      text: text.slice(0, 40),
      top: Math.round(r.top),
      left: Math.round(r.left),
      right: Math.round(r.right),
      tag: el.tagName,
    })
  }

  const dateBlockEl = document.querySelector('.nw-masthead__chrome .xl\\:flex')
  const stripBand = [...document.querySelectorAll('body > *, main ~ *')].length

  return {
    mainTop: Math.round(mainTop),
    rows: rows.sort((a, b) => a.top - b.top || a.left - b.left),
    dateBlockText: dateBlockEl ? (dateBlockEl.textContent || '').trim() : 'NOT FOUND',
    stripBand,
  }
})

console.log(JSON.stringify(dump, null, 2))
await browser.close()
