import { expect, test } from '@playwright/test'

test.describe('mobile reader experience', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chromium',
      'These checks exercise the mobile-chromium device project.',
    )
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

  test('opens and dismisses the mobile navigation', async ({ page }) => {
    // Dismiss cookie dialog if present so it cannot steal focus/Escape.
    const cookieDialog = page.getByRole('dialog', { name: 'कुकी सेटिङ' })
    if (await cookieDialog.isVisible().catch(() => false)) {
      await page
        .getByRole('button', { name: /स्वीकार|Accept|ठीक/i })
        .first()
        .click()
        .catch(() => undefined)
    }

    const menuButton = page.getByRole('button', { name: /मेनु|Menu|खोल्नुहोस्|Open/i }).first()
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    const navDialog = page.getByRole('dialog', { name: 'मुख्य नेभिगेसन' })
    await expect(navDialog).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(navDialog).toBeHidden()
  })
})
