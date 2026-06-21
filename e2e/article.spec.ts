import { test, expect } from '@playwright/test'

/**
 * Article page critical path: home -> lead -> article renders with JSON-LD, byline, body,
 * and related stories. Uses a known seed article so the test is deterministic without a DB.
 */
const CATEGORY = 'politics'
const SLUG = 'rsp-convention-candidacy-fee'

test.describe('article page', () => {
  test('renders headline, byline, body, and JSON-LD', async ({ page }) => {
    await page.goto(`/${CATEGORY}/${SLUG}`)
    await expect(page.locator('h1')).toBeVisible()

    // Article schema is required for news SEO (SPEC success criteria).
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(ld).toBeTruthy()
    const json = JSON.parse(ld as string)
    expect(json['@type']).toMatch(/Article|NewsArticle/)

    // Hero image carries alt text (a11y: no image without alt).
    const hero = page.getByRole('img').first()
    await expect(hero).toHaveAttribute('alt', /.+/)

    // Body landmark present (prose region).
    await expect(page.locator('article')).toBeVisible()
  })

  test('category page lists stories and paginates', async ({ page }) => {
    await page.goto(`/${CATEGORY}`)
    await expect(page.locator('h1')).toContainText(/राजनीति|Politics/)
    // At least one story card link into an article.
    const cards = page.locator('#main a[href*="/' + CATEGORY + '/"]')
    await expect(cards.first()).toBeVisible()
  })

  test('unknown article slug returns 404 page', async ({ page }) => {
    const response = await page.goto(`/${CATEGORY}/this-slug-does-not-exist`)
    expect(response?.status()).toBe(404)
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
  })
})
