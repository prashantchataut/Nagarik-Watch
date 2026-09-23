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

    // The front page has two legitimate shapes and this test previously only
    // knew the populated one. With no published corpus — the repo's standing
    // policy, see lib/content/seed/README.md — the page renders
    // HomeEmptyEdition instead, so the `मुख्य समाचार` region is correctly
    // absent. Both shapes owe the reader exactly one h1.
    await expect(main.locator('h1')).toHaveCount(1)
    const emptyEdition = main.locator('#empty-edition-title')
    if (await emptyEdition.count()) {
      await expect(emptyEdition).toBeVisible()
      // The service notice must still offer a way onward.
      await expect(main.getByRole('link', { name: /ताजा समाचार/ }).first()).toBeVisible()
    } else {
      const topStories = main.getByRole('region', { name: 'मुख्य समाचार' })
      await expect(topStories).toBeVisible()
      await expect(topStories.getByRole('heading', { level: 1 })).toBeVisible()
    }

    // Footer carries the copyright + registration column (legal norm for Nepali news).
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()
    await expect(footer.getByText(/© \d{4} नागरिक वाच/)).toBeVisible()
    // The registration line is rendered only once NEXT_PUBLIC_DOIB_NUMBER holds
    // a real DoIB number — Footer.tsx gates it on isPublicPublicationValue, so
    // an unconfigured environment deliberately prints nothing rather than a
    // placeholder. Assert it when it is configured; do not require a fake one.
    const registration = footer.getByText('प्रकाशन दर्ता')
    if (await registration.count()) await expect(registration.first()).toBeVisible()
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
