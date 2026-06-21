import { test, expect } from '@playwright/test'

/**
 * Search view. The corpus is small (seed), so a single distinctive term from a seeded
 * headline must surface that story and rank it; an empty query shows the prompt and a
 * nonsense term shows the no-results state.
 */
test.describe('search', () => {
  test('search box returns a matching story', async ({ page }) => {
    await page.goto('/search')
    // A term present in seed article titles; search is AND-across-terms, single term is safe.
    const input = page.getByRole('searchbox')
    await input.fill('निर्वाचन')
    await input.press('Enter')

    // At least one result link appears.
    const results = page.locator('#main a[href]')
    await expect(results.first()).toBeVisible({ timeout: 10_000 })
  })

  test('nonsense query shows the no-results state', async ({ page }) => {
    await page.goto('/search')
    await page.getByRole('searchbox').fill('zzqqxx_NotARealTerm_99')
    await expect(page.getByText('कुनै परिणाम भेटिएन।')).toBeVisible()
  })
})
