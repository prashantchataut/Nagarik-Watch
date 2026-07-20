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

const MALFORMED_PATHS = ['/en/ne', '/ne/politics', '/not-a-real-route-xyz']

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

  test('homepage does not repeat lead story in breaking ticker', async ({ page }) => {
    await page.goto('/')
    const leadHref = await page.locator('section[aria-label="Front page"], section[aria-label="मुख्य पृष्ठ"]').locator('a[href*="/"]').first().getAttribute('href')
    if (!leadHref) return
    const tickerLinks = page.locator('[aria-label="ब्रेकिङ"], [aria-label="Breaking"]').locator('a')
    const count = await tickerLinks.count()
    for (let i = 0; i < count; i += 1) {
      const href = await tickerLinks.nth(i).getAttribute('href')
      expect(href).not.toBe(leadHref)
    }
  })
})
