import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const outDir = path.dirname(fileURLToPath(import.meta.url))
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001'

const browser = await chromium.launch({ headless: true, channel: 'chrome' })

async function measure(page) {
  return page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        sel,
        top: Math.round(r.top),
        height: Math.round(r.height),
        width: Math.round(r.width),
      }
    }

    const nav = document.querySelector('.nw-masthead__primary ul')
    const navItems = nav
      ? [...nav.querySelectorAll('li > a')].map((a) => ({
          label: (a.textContent || '').trim().slice(0, 24),
          left: Math.round(a.getBoundingClientRect().left),
          right: Math.round(a.getBoundingClientRect().right),
        }))
      : []

    const navOverflow = nav
      ? {
          scrollWidth: nav.scrollWidth,
          clientWidth: nav.clientWidth,
          overflowPx: nav.scrollWidth - nav.clientWidth,
        }
      : null

    const firstHeadline = document.querySelector('[data-home-role="lead"] h1')
    const headlineTop = firstHeadline
      ? Math.round(firstHeadline.getBoundingClientRect().top)
      : null

    const chromeStack = [
      '.nw-masthead__chrome',
      '.nw-masthead__primary',
      '.nw-masthead__topics',
      'main',
    ].map(box)

    const cookie = [...document.querySelectorAll('div,section,aside')].find((el) => {
      const t = (el.textContent || '').trim()
      const r = el.getBoundingClientRect()
      return (
        r.height > 40 &&
        r.width > 240 &&
        getComputedStyle(el).position === 'fixed' &&
        /कुकी|cookie/i.test(t)
      )
    })

    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      chromeStack,
      navItems,
      navOverflow,
      headlineTop,
      cookie: cookie
        ? {
            height: Math.round(cookie.getBoundingClientRect().height),
            width: Math.round(cookie.getBoundingClientRect().width),
            top: Math.round(cookie.getBoundingClientRect().top),
            text: (cookie.textContent || '').trim().slice(0, 160),
          }
        : null,
    }
  })
}

const results = {}

for (const [name, viewport] of [
  ['desktop-1280', { width: 1280, height: 900 }],
  ['desktop-1440', { width: 1440, height: 900 }],
  ['mobile-390', { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport })
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(3500)
  await page.screenshot({ path: path.join(outDir, `chrome-${name}.png`), fullPage: false })
  results[name] = await measure(page)
  await page.close()
}

fs.writeFileSync(path.join(outDir, 'chrome-metrics.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))

await browser.close()
