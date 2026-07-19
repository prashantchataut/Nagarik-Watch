import { test, expect } from '@playwright/test'

/**
 * Theme toggle. The inline head script sets data-theme before paint; the toggle button flips
 * it and persists to localStorage (nw-theme). The contract under test: clicking the button
 * changes data-theme and the value survives a reload.
 */
test.describe('theme toggle', () => {
  test('toggles data-theme and persists', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('nw-theme', 'light'))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    // Button label reflects the *next* (destination) theme after mount.
    await page.getByRole('button', { name: 'डार्क मोड' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('nw-theme')))
      .toBe('dark')

    // Persistence: reload keeps the choice (boot script reads nw-theme).
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
