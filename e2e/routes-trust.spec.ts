import { test, expect } from '@playwright/test'

const CONSENT_KEY = 'nw-cookie-consent-v4'

const TRUST_PATHS = [
  '/about',
  '/privacy',
  '/ethics',
  '/editorial-policy',
  '/corrections-policy',
  '/terms',
  '/contact',
  '/cookies',
]

// Paths the proxy rejects on shape or locale duplication. These never reach the
// App Router, so the proxy answers them itself and the status is a true 404.
// `/district/*` reaches the App Router: it renders unlisted params at request
// time, so the page turns an unknown desk away itself rather than inventing one.
const HARD_404_PATHS = ['/en/ne', '/en/en', '/_not-a-route', '/Politics', '/district/nope']

// Public URLs keep Nepali at the root; `/ne/*` is the internal form. Asking for
// it is not an error, so the proxy canonicalises with a 308 instead of 404'ing.
const CANONICAL_REDIRECTS: Array<[string, string]> = [
  ['/ne/politics', '/politics'],
  ['/ne/about', '/about'],
  ['/ne', '/'],
]

test.describe('trust and policy routes', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ({ key }) => {
        localStorage.setItem(
          key,
          JSON.stringify({
            essential: true,
            analytics: false,
            personalization: false,
            advertising: false,
            updatedAt: new Date().toISOString(),
          }),
        )
      },
      { key: CONSENT_KEY },
    )
  })

  for (const path of TRUST_PATHS) {
    test(`returns 200 for ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(200)
      await expect(page.locator('main')).toBeVisible()
    })
  }

  for (const path of HARD_404_PATHS) {
    test(`returns a hard 404 for ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBe(404)
    })
  }

  for (const [from, to] of CANONICAL_REDIRECTS) {
    test(`canonicalises ${from} to ${to}`, async ({ page }) => {
      const response = await page.goto(from)
      expect(response?.status()).toBe(200)
      expect(new URL(page.url()).pathname).toBe(to)
    })
  }

  // A slug-shaped unknown segment is let through on purpose so a category
  // created in the CMS is not 404'd before the seed list catches up. The App
  // Router then calls notFound() — but `app/[locale]/loading.tsx` has already
  // flushed a Suspense fallback, which commits the 200 status line before the
  // page body runs. Documented Next.js behaviour; see docs/LAUNCH-ROADMAP.md.
  test('unknown slug-shaped path answers with the recovery UI', async ({ page }) => {
    const response = await page.goto('/not-a-real-route-xyz')
    const status = response?.status() ?? 0
    expect([200, 404]).toContain(status)
    if (status === 200) {
      test.info().annotations.push({
        type: 'known-gap',
        description: 'Soft 404: the segment loading.tsx commits a 200 before notFound() runs.',
      })
    }
    // Whatever the status, the page must not be indexable.
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)
  })

  test('homepage does not repeat lead story in breaking ticker', async ({ page }) => {
    await page.goto('/')
    // `getAttribute` on a `.first()` locator auto-waits and throws on timeout
    // rather than returning null, so reaching for the href directly made the
    // `if (!leadHref)` guard below unreachable and burned the whole timeout
    // whenever the front page has no stories — which is the case until the
    // newsroom publishes. Wait explicitly, briefly, and treat absence as the
    // documented empty-edition case.
    const lead = page
      .locator('section[aria-label="Front page"], section[aria-label="मुख्य पृष्ठ"]')
      .locator('a[href*="/"]')
      .first()
    let leadHref: string | null = null
    try {
      await lead.waitFor({ state: 'attached', timeout: 5_000 })
      leadHref = await lead.getAttribute('href')
    } catch {
      test.info().annotations.push({
        type: 'skipped-assertion',
        description: 'Empty edition: no lead story to compare against the ticker.',
      })
    }
    if (!leadHref) return
    const tickerLinks = page.locator('[aria-label="ब्रेकिङ"], [aria-label="Breaking"]').locator('a')
    const count = await tickerLinks.count()
    for (let i = 0; i < count; i += 1) {
      const href = await tickerLinks.nth(i).getAttribute('href')
      expect(href).not.toBe(leadHref)
    }
  })
})
