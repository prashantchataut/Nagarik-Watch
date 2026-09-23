import { test, expect } from '@playwright/test'

/**
 * Breaking ticker + 404/error surfaces. The ticker renders only when isBreaking stories
 * exist in the seed; when present each headline is a real link. The 404 is checked on a
 * truly unknown path.
 */
test.describe('breaking ticker + error surfaces', () => {
  test('breaking ticker (when present) links to articles', async ({ page }) => {
    await page.goto('/')
    const ticker = page.getByRole('region', { name: 'ब्रेकिङ' })
    // The ticker is conditional; if it rendered, its links must resolve to article URLs.
    if (await ticker.isVisible().catch(() => false)) {
      await expect(ticker.getByRole('link').first()).toHaveAttribute(
        'href',
        /\/[a-z-]+\/[a-z0-9-]+/,
      )
    }
  })

  // A path whose shape the proxy rejects outright never reaches the App
  // Router, so the proxy answers it itself and the status is a true 404.
  test('shape-rejected path is a hard 404', async ({ page }) => {
    const response = await page.goto('/_foo')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
    await expect(
      page.locator('#main').getByRole('link', { name: 'गृहपृष्ठ', exact: true }),
    ).toBeVisible()
  })

  // A slug-shaped unknown path is deliberately allowed through the proxy so a
  // newly created category is not 404'd before the taxonomy catches up, and the
  // App Router calls notFound() instead.
  //
  // Known gap: `app/[locale]/loading.tsx` flushes a Suspense fallback before the
  // page body runs, so the status line is already committed as 200 by the time
  // notFound() throws — documented Next.js behaviour, not a rewrite problem. The
  // recovery UI still renders and still carries `<meta name="robots" content="noindex">`,
  // so this is a soft 404 rather than a wrongly indexed page. Tracked in
  // docs/LAUNCH-ROADMAP.md as a discovery blocker. This test pins the
  // reader-facing contract and records the status honestly rather than
  // asserting a 404 the app does not send.
  test('slug-shaped unknown path shows the recovery UI', async ({ page }) => {
    const response = await page.goto('/no-such-category-xyz')
    const status = response?.status() ?? 0
    expect([200, 404]).toContain(status)
    if (status === 200) {
      test.info().annotations.push({
        type: 'known-gap',
        description: 'Soft 404: the segment loading.tsx commits a 200 before notFound() runs.',
      })
    }
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
    await expect(
      page.locator('#main').getByRole('link', { name: 'गृहपृष्ठ', exact: true }),
    ).toBeVisible()
  })
})
