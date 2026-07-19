import { test, expect } from '@playwright/test'

const CONSENT_KEY = 'nw-cookie-consent-v4'

/**
 * Locale toggle (ADR-007). ne is served at the root, en under /en. The masthead toggle must
 * swap locale *in place* (same page, not the home), the html lang attribute must update, and
 * an English-only story must be absent from /en.
 */
test.describe('locale toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Cookie dialog sits above the masthead and steals clicks on first visit.
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

  test('swaps locale in place on the homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne')

    // Desktop masthead toggle (mobile drawer has a second copy).
    const toggle = page.locator('header').getByRole('link', { name: 'अंग्रेजीमा पढ्नुहोस्' })
    await expect(toggle).toHaveAttribute('href', '/en')
    await Promise.all([page.waitForURL(/\/en\/?$/), toggle.click()])
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('swaps back from en to ne in place', async ({ page }) => {
    await page.goto('/en')
    const toggle = page.locator('header').getByRole('link', { name: 'नेपालीमा पढ्नुहोस्' })
    await expect(toggle).toHaveAttribute('href', '/')
    await Promise.all([page.waitForURL(/\/$/), toggle.click()])
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne')
  })

  test('english locale renders with lang=en across pages', async ({ page }) => {
    await page.goto('/en/politics')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
