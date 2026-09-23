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
      // Match the empty state by test id, not by copy. The Nepali wording has
      // been reworded since this test was written, so the old text regex
      // matched neither the story list nor the empty state and the assertion
      // could only ever fail on an empty corpus.
      const empty = page.getByTestId('category-empty')
      const hasStory = await storyLinks
        .first()
        .isVisible()
        .catch(() => false)
      if (!hasStory) await expect(empty.first()).toBeVisible()
    }
  })

  test('unknown article slug returns 404 page', async ({ page }) => {
    const response = await page.goto('/politics/this-slug-does-not-exist')
    // Locale middleware rewrites can soften App Router notFound() to HTTP 200.
    // Require the recovery UI always; prefer a real 404 status when the runtime provides it.
    expect([404, 200]).toContain(response?.status() ?? 0)
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
  })

  test('if homepage exposes a story, article page has article schema and body landmark', async ({
    page,
  }) => {
    await page.goto('/')
    // `getAttribute` auto-waits and throws on timeout rather than returning
    // null, so reaching for the href directly made the `test.skip` below
    // unreachable — the honest-empty case this test names in its own title
    // could never be taken. Wait explicitly and briefly instead.
    const storyLink = page
      .locator(
        '#main a[href^="/politics/"], #main a[href^="/society/"], #main a[href^="/economy/"]',
      )
      .first()
    let href: string | null = null
    try {
      await storyLink.waitFor({ state: 'attached', timeout: 5_000 })
      href = await storyLink.getAttribute('href')
    } catch {
      href = null
    }
    test.skip(!href, 'No published stories in the honest empty-store fixture')
    // Prefer navigation over click — home rails can animate and fail stability checks.
    await page.goto(href!)
    await expect(page.locator('h1')).toBeVisible()
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(ld).toBeTruthy()
    await expect(page.locator('#main > article').first()).toBeVisible()
  })
})
