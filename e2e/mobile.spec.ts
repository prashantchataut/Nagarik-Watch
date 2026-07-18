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
    const menuButton = page.locator('button[aria-controls][aria-expanded="false"]').first()
    await expect(menuButton).toBeVisible()
    await menuButton.click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
