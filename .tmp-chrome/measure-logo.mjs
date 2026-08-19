import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3001'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })

const out = {}

for (const [name, viewport] of [
  ['mobile-390', { width: 390, height: 844 }],
  ['desktop-1280', { width: 1280, height: 900 }],
  ['desktop-1440', { width: 1440, height: 900 }],
]) {
  const page = await browser.newPage({ viewport })
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(3000)

  out[name] = await page.evaluate(() => {
    const r = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return {
        top: Math.round(b.top),
        bottom: Math.round(b.bottom),
        left: Math.round(b.left),
        right: Math.round(b.right),
        w: Math.round(b.width),
        h: Math.round(b.height),
      }
    }

    const logoLink = document.querySelector('.nw-masthead__logo')
    const logoSpan = logoLink?.querySelector('span')
    const wordmark = logoSpan?.querySelector('span > span')
    const navBar = document.querySelector('.nw-masthead__primary')
    const chrome = document.querySelector('.nw-masthead__chrome')
    const chromeRow = logoLink?.parentElement?.parentElement ?? null

    // date block + utility cluster on desktop
    const dateBlock = [...(chrome?.querySelectorAll('div') ?? [])].find((d) =>
      d.className.includes('border-l') && d.className.includes('flex-col'),
    )

    const utilCluster = [...(chrome?.querySelectorAll('div') ?? [])].find((d) =>
      d.className.includes('justify-end'),
    )

    const strip = [...document.querySelectorAll('div')].find((d) =>
      /मौसम|Weather|NEPSE|नेप्से|बजार/.test(d.textContent ?? '') &&
      d.className.includes('border-b') &&
      d.getBoundingClientRect().height > 20 &&
      d.getBoundingClientRect().height < 90,
    )

    return {
      logoLink: r(logoLink),
      wordmark: r(wordmark),
      wordmarkText: wordmark?.textContent?.trim().slice(0, 30) ?? null,
      wordmarkLines: wordmark
        ? Math.round(
            wordmark.getBoundingClientRect().height /
              parseFloat(getComputedStyle(wordmark).lineHeight || '0'),
          )
        : null,
      wordmarkFont: wordmark ? getComputedStyle(wordmark).fontSize : null,
      chromeRow: r(chromeRow),
      chrome: r(chrome),
      navBar: r(navBar),
      logoOverflowsRow:
        logoLink && chrome
          ? Math.round(logoLink.getBoundingClientRect().bottom - chrome.getBoundingClientRect().bottom)
          : null,
      dateBlock: r(dateBlock),
      dateVisible: dateBlock ? getComputedStyle(dateBlock).display !== 'none' : false,
      utilCluster: r(utilCluster),
      gapLogoToUtil:
        logoLink && utilCluster
          ? Math.round(
              utilCluster.getBoundingClientRect().left - logoLink.getBoundingClientRect().right,
            )
          : null,
      strip: r(strip),
      stripText: strip?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) ?? null,
    }
  })

  await page.close()
}

console.log(JSON.stringify(out, null, 2))
await browser.close()
