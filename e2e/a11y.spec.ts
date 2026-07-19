import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const CONSENT_KEY = 'nw-cookie-consent-v4'
const REQUIRED_ROUTES = ['/', '/en', '/politics', '/search', '/about', '/auth/login']

async function scanPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main').first()).toBeVisible()

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  // Color-contrast remains tracked in the dedicated a11y job; this gate blocks
  // structural critical/serious failures that break reading or interaction.
  const blockingViolations = results.violations.filter(
    ({ impact, id }) => (impact === 'critical' || impact === 'serious') && id !== 'color-contrast',
  )

  expect(
    blockingViolations,
    `${path} has critical or serious WCAG A/AA violations:\n${JSON.stringify(
      blockingViolations.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        targets: nodes.map(({ target }) => target),
      })),
      null,
      2,
    )}`,
  ).toEqual([])
}

test.describe('automated accessibility audit', () => {
  test.beforeEach(async ({ page }) => {
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
  })

  test('public routes have no critical or serious WCAG A/AA violations', async ({ page }) => {
    test.setTimeout(120_000)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const firstArticlePath = await page
      .locator('#main article a[href]')
      .first()
      .getAttribute('href')

    const routes = firstArticlePath
      ? [...REQUIRED_ROUTES, new URL(firstArticlePath, 'http://localhost').pathname]
      : REQUIRED_ROUTES

    for (const path of routes) {
      await test.step(`scan ${path}`, async () => {
        await scanPage(page, path)
      })
    }
  })
})
