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

  // One test per route: a slow route cannot fail the whole audit, failures name
  // the offending URL, and Playwright can run the scans across workers.
  for (const path of REQUIRED_ROUTES) {
    test(`no critical or serious WCAG A/AA violations: ${path}`, async ({ page }) => {
      await scanPage(page, path)
    })
  }

  test('no critical or serious WCAG A/AA violations: first published article', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // An edition with no published stories is a legitimate product state (the
    // reader gets an honest empty state, not fixtures), so only audit the
    // article route when one actually exists.
    const firstArticle = page.locator('#main article a[href]').first()
    await firstArticle.waitFor({ state: 'attached', timeout: 5_000 }).catch(() => undefined)
    const firstArticlePath = await firstArticle.getAttribute('href').catch(() => null)
    test.skip(!firstArticlePath, 'No published stories in the honest empty-store edition')

    await scanPage(page, new URL(firstArticlePath!, 'http://localhost').pathname)
  })
})
