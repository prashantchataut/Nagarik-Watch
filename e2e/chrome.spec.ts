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

  test('unknown top-level path shows a real 404 with recovery links', async ({ page }) => {
    const response = await page.goto('/no-such-category-xyz')
    // A genuine 404, not a streamed 200 with the recovery body. The status is
    // decided in proxy.ts because Next commits 200 as soon as a loading.tsx
    // boundary streams (vercel/next.js #93253).
    expect(response?.status()).toBe(404)
    await expect(page.getByText('पृष्ठ फेला परेन')).toBeVisible()
    // Recovery links: home, latest, and the recovery search box.
    await expect(page.getByRole('link', { name: 'गृहपृष्ठ' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'ताजा समाचार' })).toBeVisible()
    await expect(page.getByRole('searchbox', { name: /खोज्नुहोस्/ })).toBeVisible()
  })
})
