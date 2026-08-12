import { expect, test } from '@playwright/test'

const CONSENT_KEY = 'nw-cookie-consent-v4'

async function grantEssentialConsent(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ key }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          essential: true,
          personalization: false,
          analytics: false,
          advertising: false,
          decidedAt: new Date().toISOString(),
          version: 4,
        }),
      )
    },
    { key: CONSENT_KEY },
  )
}

test.describe('mobile reader experience', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chromium',
      'These checks exercise the mobile-chromium device project.',
    )
    await grantEssentialConsent(page)
    await page.goto('/')
  })

  test('renders main content without page-level horizontal overflow', async ({ page }) => {
    await expect(page.locator('#main')).toBeVisible()
    await expect(page.locator('#main h1, #main h2').first()).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }))
    expect(dimensions.viewport).toBeLessThanOrEqual(500)
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1)
  })

  test('opens and dismisses the mobile navigation as a modal sheet', async ({ page }) => {
    const menuButton = page.getByRole('button', { name: /मेनु|Menu|खोल्नुहोस्|Open/i }).first()
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    const navDialog = page.getByRole('dialog', { name: 'मुख्य नेभिगेसन' })
    await expect(navDialog).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(navDialog).toBeHidden()
    await expect(menuButton).toBeFocused()
  })

  test('keeps bottom navigation focused on repeat reader destinations', async ({ page }) => {
    const bottomNav = page.locator('.nw-bottom-nav')
    await expect(bottomNav).toBeVisible()
    await expect(bottomNav.getByRole('link')).toHaveCount(5)
    await expect(bottomNav).toContainText('पात्रो')
    await expect(bottomNav).toContainText('सुरक्षित')
    await expect(bottomNav).not.toContainText('खोज')
  })

  test('opens global search without navigating away first', async ({ page }) => {
    const searchButton = page
      .locator('.nw-masthead__chrome')
      .getByRole('button', { name: /खोज|Search/i })
      .first()
    await searchButton.click()

    const searchDialog = page.getByRole('dialog', { name: /खोज|Search/i })
    await expect(searchDialog).toBeVisible()
    const input = searchDialog.locator('input[type="search"]')
    await expect(input).toBeFocused()
    await input.fill('काठमाडौं')
    await input.press('Enter')

    await expect(page).toHaveURL(/\/search\?q=/)
    expect(new URL(page.url()).searchParams.get('q')).toBe('काठमाडौं')
  })

  test('keeps a visible sticky ad above the bottom navigation', async ({ page }) => {
    const navBox = await page.locator('.nw-bottom-nav').boundingBox()
    expect(navBox).not.toBeNull()

    const stickyAd = page.locator('[data-bottom-slot="ad"]')
    if (await stickyAd.isVisible().catch(() => false)) {
      const adBox = await stickyAd.boundingBox()
      expect(adBox).not.toBeNull()
      if (navBox && adBox) {
        expect(adBox.y + adBox.height).toBeLessThanOrEqual(navBox.y + 1)
      }
    }
  })
})

test.describe('mobile consent surfaces', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chromium',
      'These checks exercise the mobile-chromium device project.',
    )
    await page.goto('/')
  })

  test('uses a non-modal first-visit banner and a modal preferences sheet', async ({ page }) => {
    const banner = page.getByRole('region', { name: 'कुकी छनोट' })
    await expect(banner).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'कुकी छनोट' })).toBeHidden()

    await banner.getByRole('button', { name: 'अनुकूलन' }).click()
    const preferences = page.getByRole('dialog', { name: 'कुकी छनोट' })
    await expect(preferences).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(preferences).toBeHidden()
    await expect(banner).toBeVisible()
  })
})
