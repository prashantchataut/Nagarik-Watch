import { test, expect } from '@playwright/test'

/**
 * Breaking ticker + 404/error surfaces. The ticker renders only when isBreaking stories
 * exist in the seed; when present each headline is a real link. The 404 is checked on a
 * truly unknown path.
 */
test.describe('breaking ticker + error surfaces', () => {
  test('breaking ticker (when present) links to articles', async ({ page }) => {
    await page.goto('/')
    const ticker = page.getByRole('region', { name: 'ब्रेकिङ' })
    // The ticker is conditional; if it rendered, its links must resolve to article URLs.
    if (await ticker.isVisible().catch(() => false)) {
      await expect(ticker.getByRole('link').first()).toHaveAttribute('href', /\/[a-z-]+\/[a-z0-9-]+/)
    }
  })

  test('unknown top-level path shows 404 page', async ({ page }) => {
    const response = await page.goto('/no-such-category-xyz')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
    // Bilingual home links are offered.
    await expect(page.getByRole('link', { name: 'गृहपृष्ठमा फर्कनुहोस्' })).toBeVisible()
  })
})
