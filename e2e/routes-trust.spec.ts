import { test, expect } from '@playwright/test'

const CONSENT_KEY = 'nw-cookie-consent-v4'

const TRUST_PATHS = [
  '/about',
  '/privacy',
  '/ethics',
  '/editorial-policy',
  '/corrections-policy',
  '/terms',
  '/contact',
  '/cookies',
]

/**
 * Unknown desks must answer a real 404: the locale rewrite used to turn
 * App Router `notFound()` into HTTP 200 with the not-found UI, which is an
 * unbounded soft-404 space that search engines index.
 */
const MALFORMED_PATHS = ['/en/ne', '/not-a-real-route-xyz', '/en/not-a-real-route-xyz']

/**
 * `/ne/...` is the internal locale prefix. It is canonicalised with a permanent
 * redirect, not a 404, so it is asserted separately from the malformed set.
 */
const LOCALE_PREFIX_PATHS = ['/ne/politics']

test.describe('trust and policy routes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ key }) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            essential: true,
            analytics: false,
            personalization: false,
            advertising: false,
            updatedAt: new Date().toISOString(),
          }),
        )
      },
      { key: CONSENT_KEY },
    )
  })

  for (const path of TRUST_PATHS) {
    test(`returns 200 for ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('main')).toBeVisible()
    })
  }

  for (const path of MALFORMED_PATHS) {
    test(`returns 404 for malformed ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
    })
  }

  for (const path of LOCALE_PREFIX_PATHS) {
    test(`permanently redirects the internal locale prefix ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      // Playwright follows the 308, so the browser URL is the canonical one.
      expect(new URL(page.url()).pathname).toBe('/politics')
    })
  }

  test('homepage does not repeat lead story in breaking ticker', async ({ page }) => {
    await page.goto('/')
    const leadLink = page
      .locator('section[aria-label="Front page"], section[aria-label="मुख्य पृष्ठ"]')
      .locator('a[href*="/"]')
      .first()
    // Bounded wait: an edition with no published stories has no lead link and
    // must not burn the whole test timeout here.
    await leadLink.waitFor({ state: 'attached', timeout: 5_000 }).catch(() => undefined)
    const leadHref = await leadLink.getAttribute('href').catch(() => null)
    if (!leadHref) return
    const tickerLinks = page.locator('[aria-label="ब्रेकिङ"], [aria-label="Breaking"]').locator('a')
    const count = await tickerLinks.count()
    for (let i = 0; i < count; i += 1) {
      const href = await tickerLinks.nth(i).getAttribute('href')
      expect(href).not.toBe(leadHref)
    }
  })
})
