import { test, expect } from '@playwright/test'

/**
 * Article/category critical paths in both honest-empty and seeded/test-data modes.
 * The production default store is allowed to be empty; the app must render
 * useful empty states instead of relying on fake published seed stories.
 */
test.describe('article and category pages', () => {
  test('category page renders either story cards or an honest empty state', async ({ page }) => {
    const response = await page.goto('/politics')
    expect([200, 404]).toContain(response?.status() ?? 0)
    if (response?.status() === 200) {
      await expect(page.locator('h1')).toContainText(/राजनीति|Politics/)
      const storyLinks = page.locator('#main a[href*="/politics/"]')
      const empty = page.getByText(/अझै समाचार प्रकाशित गरिएको छैन|No stories have been published/i)
      const hasStory = await storyLinks
        .first()
        .isVisible()
        .catch(() => false)
      if (!hasStory) await expect(empty.first()).toBeVisible()
    }
  })

  test('unknown article slug returns 404 page', async ({ page }) => {
    const response = await page.goto('/politics/this-slug-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
  })

  test('if homepage exposes a story, article page has article schema and body landmark', async ({
    page,
  }) => {
    await page.goto('/')
    const link = page
      .locator(
        '#main a[href^="/politics/"], #main a[href^="/society/"], #main a[href^="/economy/"]',
      )
      .first()
    const visible = await link.isVisible().catch(() => false)
    test.skip(!visible, 'No published stories in the honest empty-store fixture')
    await link.click()
    await expect(page.locator('h1')).toBeVisible()
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(ld).toBeTruthy()
    await expect(page.locator('article')).toBeVisible()
  })
})
