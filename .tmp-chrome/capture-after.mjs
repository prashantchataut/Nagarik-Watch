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

    const logoLink = document.querySelector('.nw-masthead__logo')
    const chrome = document.querySelector('.nw-masthead__chrome')
    const logoOverflow =
      logoLink && chrome
        ? Math.round(logoLink.getBoundingClientRect().bottom - chrome.getBoundingClientRect().bottom)
        : null

    const nav = document.querySelector('.nw-masthead__navrail, .nw-masthead__primary ul')
    const navItems = nav
      ? [...nav.querySelectorAll(':scope > li')].map((li) => {
          const a = li.querySelector('a, button')
          const r = a?.getBoundingClientRect()
          return {
            label: (a?.textContent || '').trim().slice(0, 24),
            visible: r ? r.width > 0 && r.height > 0 : false,
            left: r ? Math.round(r.left) : null,
            right: r ? Math.round(r.right) : null,
          }
        })
      : []

    const navOverflow = nav
      ? {
          scrollWidth: nav.scrollWidth,
          clientWidth: nav.clientWidth,
          overflowPx: nav.scrollWidth - nav.clientWidth,
        }
      : null

    const stripGone = !document.querySelector('.nw-utility-strip')
    const hasMastheadRef = !!document.querySelector(
      '.nw-masthead__chrome [class*="border-l"] span, .nw-masthead__chrome button',
    )

    const topics = document.querySelector('.nw-masthead__topics')
    const topicLabels = topics
      ? [...topics.querySelectorAll('a')].map((a) => (a.textContent || '').trim())
      : []

    const main = document.querySelector('main')
    const headline = document.querySelector('[data-home-role="lead"] h1')

    return {
      vw: window.innerWidth,
      chrome: box('.nw-masthead__chrome'),
      primary: box('.nw-masthead__primary'),
      topics: box('.nw-masthead__topics'),
      mainTop: main ? Math.round(main.getBoundingClientRect().top) : null,
      headlineTop: headline ? Math.round(headline.getBoundingClientRect().top) : null,
      logoOverflow,
      navItems,
      navOverflow,
      stripGone,
      hasMastheadRef,
      topicLabels,
    }
  })
}

const results = {}
for (const [name, viewport, theme] of [
  ['desktop-1280-light', { width: 1280, height: 900 }, 'light'],
  ['desktop-1280-dark', { width: 1280, height: 900 }, 'dark'],
  ['mobile-390-light', { width: 390, height: 844 }, 'light'],
  ['mobile-390-dark', { width: 390, height: 844 }, 'dark'],
]) {
  const page = await browser.newPage({ viewport })
  await page.addInitScript((value) => localStorage.setItem('nw-theme', value), theme)
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 180000 })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: path.join(outDir, `chrome-after-${name}.png`), fullPage: false })
  results[name] = { theme, ...(await measure(page)) }
  await page.close()
}

fs.writeFileSync(path.join(outDir, 'chrome-after-metrics.json'), JSON.stringify(results, null, 2))
console.log(JSON.stringify(results, null, 2))
await browser.close()
