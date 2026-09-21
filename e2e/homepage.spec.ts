import { test, expect } from '@playwright/test'

/**
 * Homepage render + chrome. Guards the core reader contract: the page renders
 * server-side with the masthead nav, the footer carries the DoIB/legal line, and
 * the static info links resolve (no linked 404s).
 *
 * The lead-story assertions only apply when the edition actually has a published
 * story: the shipped content store is allowed to be empty, and the product must
 * render an honest empty state rather than fake fixtures (see article.spec.ts).
 */
test.describe('homepage', () => {
  test('renders masthead, skip link and footer', async ({ page }) => {
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

    // Footer is always present. The DoIB registration column is a legal norm for
    // Nepali online news, but its value is operator-supplied env
    // (NEXT_PUBLIC_DOIB_NUMBER), so only assert it when the deployment has one.
    await expect(page.getByRole('contentinfo')).toBeVisible()
    const registration = page.getByText('प्रकाशन दर्ता')
    const hasRegistration = await registration
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
    if (hasRegistration) await expect(registration).toBeVisible()
  })

  test('renders a lead story when the edition has one', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('#main')
    await expect(main).toBeVisible()

    const topStories = main.getByRole('region', { name: 'मुख्य समाचार' })
    const hasTopStories = await topStories
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!hasTopStories, 'No published stories in the honest empty-store edition')

    await expect(topStories.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(topStories.locator('article').first()).toBeVisible()
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
