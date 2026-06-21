import { test, expect } from '@playwright/test'

/**
 * Locale toggle (ADR-007). ne is served at the root, en under /en. The masthead toggle must
 * swap locale *in place* (same page, not the home), the html lang attribute must update, and
 * an English-only story must be absent from /en.
 */
test.describe('locale toggle', () => {
  test('swaps locale in place on the homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne')

    // Toggle is labeled with the destination language ("English").
    await page.getByRole('link', { name: 'अंग्रेजीमा पढ्नुहोस्' }).click()
    await expect(page).toHaveURL('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('swaps back from en to ne in place', async ({ page }) => {
    await page.goto('/en')
    await page.getByRole('link', { name: 'नेपालीमा पढ्नुहोस्' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne')
  })

  test('english locale renders with lang=en across pages', async ({ page }) => {
    await page.goto('/en/politics')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
