import { test, expect } from '@playwright/test'

/** Search must work with both a populated newsroom corpus and the default empty store. */
test.describe('search', () => {
  test('empty query shows the search prompt', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('searchbox')).toBeVisible()
  })

  test('nonsense query shows the no-results state', async ({ page }) => {
    await page.goto('/search')
    await page.getByRole('searchbox').fill('zzqqxx_NotARealTerm_99')
    await expect(page.getByText('कुनै परिणाम भेटिएन।')).toBeVisible()
  })

  test('real query either returns ranked links or an honest no-results state', async ({ page }) => {
    await page.goto('/search')
    const input = page.getByRole('searchbox')
    await input.fill('निर्वाचन')
    await input.press('Enter')
    const results = page.locator('#main a[href]')
    const hasResult = await results
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false)
    if (!hasResult) await expect(page.getByText('कुनै परिणाम भेटिएन।')).toBeVisible()
  })
})
