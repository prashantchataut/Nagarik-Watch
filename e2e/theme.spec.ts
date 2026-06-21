import { test, expect } from '@playwright/test'

/**
 * Theme toggle. The inline head script sets data-theme before paint; the toggle button flips
 * it and persists to localStorage (nw-theme). The contract under test: clicking the button
 * changes data-theme and the value survives a reload.
 */
test.describe('theme toggle', () => {
  test('toggles data-theme and persists', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nw-theme', 'light')
      } catch {
        // ignore
      }
    })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    // Button label reflects the *next* (destination) theme after mount.
    await page.getByRole('button', { name: 'डार्क मोड' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // Persistence: reload keeps the choice.
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})
