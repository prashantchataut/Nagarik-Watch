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
 * Paths that must answer a real HTTP 404.
 *
 * `/ne/politics` used to be listed here, but the `/ne` prefix is a legacy
 * locale URL that the proxy permanently redirects to the canonical root path
 * (308), so its final status is the desk's, not 404. That behaviour is asserted
 * separately below.
 */
const MALFORMED_PATHS = ['/en/ne', '/not-a-real-route-xyz']

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
      // The recovery page, not a blank error.
      await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
    })
  }

  test('legacy /ne prefix permanently redirects to the canonical path', async ({ page }) => {
    const response = await page.goto('/ne/politics')
    // 308 from the proxy, then the desk itself answers (200 with stories, 404
    // while the store is empty). What must never happen is the legacy path
    // being served directly as a duplicate URL.
    expect(response?.request().redirectedFrom()?.url()).toContain('/ne/politics')
    expect(new URL(page.url()).pathname).toBe('/politics')
  })

  test('homepage does not repeat lead story in breaking ticker', async ({ page }) => {
    await page.goto('/')
    const leadLinks = page
      .locator('section[aria-label="Front page"], section[aria-label="मुख्य पृष्ठ"]')
      .locator('a[href*="/"]')
    // An empty store renders the honest empty edition, so there is no lead to
    // compare. `count()` returns immediately; `getAttribute()` would wait out
    // the test timeout on a zero-match locator.
    test.skip((await leadLinks.count()) === 0, 'Empty store: no front-page lead story')
    const leadHref = await leadLinks.first().getAttribute('href')
    if (!leadHref) return
    const tickerLinks = page.locator('[aria-label="ब्रेकिङ"], [aria-label="Breaking"]').locator('a')
    const count = await tickerLinks.count()
    for (let i = 0; i < count; i += 1) {
      const href = await tickerLinks.nth(i).getAttribute('href')
      expect(href).not.toBe(leadHref)
    }
  })
})
