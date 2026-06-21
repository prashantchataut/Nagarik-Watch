import { test, expect } from '@playwright/test'

/**
 * Homepage render + chrome. Guards the core reader contract: the page renders server-side
 * with a lead story, the masthead nav is present and keyboard-reachable, the footer carries
 * the DoIB/legal line, and the static info links resolve (no linked 404s).
 */
test.describe('homepage', () => {
  test('renders lead story, masthead, and footer', async ({ page }) => {
    await page.goto('/')
    // The locale segment is rewritten to /ne internally; lang attribute reflects it.
    await expect(page.locator('html')).toHaveAttribute('lang', 'ne')

    // Skip link is first focusable and points at main.
    await expect(page.getByRole('link', { name: 'मूल सामग्रीमा जानुहोस्' })).toHaveAttribute(
      'href',
      '#main',
    )

    // Main landmark exists and is not empty (server-rendered, no client fetch).
    const main = page.locator('#main')
    await expect(main).toBeVisible()
    await expect(main.locator('h1, h2').first()).toBeVisible()

    // Footer carries the copyright + registration column (legal norm for Nepali news).
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByText('प्रकाशन दर्ता')).toBeVisible()
  })

  test('primary nav links to a category page', async ({ page }) => {
    await page.goto('/')
    // politics is a seed category present in both locales.
    const nav = page.getByRole('navigation', { name: 'मुख्य नेभिगेसन' })
    await nav.getByRole('link', { name: 'राजनीति' }).click()
    await expect(page).toHaveURL(/\/(en\/)?politics/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('footer info links resolve without 404', async ({ page }) => {
    const infoPaths = ['/about', '/ethics', '/privacy', '/contact']
    for (const p of infoPaths) {
      const response = await page.goto(p)
      expect(response?.status(), `${p} should be 200`).toBe(200)
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('sitemap and robots are reachable', async ({ page }) => {
    const sitemap = await page.goto('/sitemap.xml')
    expect(sitemap?.status()).toBe(200)
    await expect(page.locator('urlset')).toHaveCount(1)

    const robots = await page.goto('/robots.txt')
    expect(robots?.status()).toBe(200)
  })
})
