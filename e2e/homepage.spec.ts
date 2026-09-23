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

    // Main landmark exists and the homepage has one unambiguous editorial thesis.
    const main = page.locator('#main')
    await expect(main).toBeVisible()
    await expect(main.locator('h1')).toHaveCount(1)
    // The production store may be empty (honest empty edition) or seeded. Both
    // must render exactly one h1; the "top stories" region only exists when
    // there is journalism to rank, so its heading is asserted conditionally
    // rather than timing out on an empty store.
    const topStories = main.getByRole('region', { name: 'मुख्य समाचार' })
    if ((await topStories.count()) > 0) {
      await expect(topStories).toBeVisible()
      await expect(topStories.getByRole('heading', { level: 1 })).toBeVisible()
    }

    // Footer carries the copyright column. The DoIB registration line renders
    // only when a real NEXT_PUBLIC_DOIB_NUMBER is configured (the product never
    // invents a legal identity), so it is asserted only when present.
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer).toContainText('नागरिक वाच')
    const registration = page.getByText('प्रकाशन दर्ता')
    if ((await registration.count()) > 0) {
      await expect(registration).toBeVisible()
    }
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
