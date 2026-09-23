import { expect, test, type Page } from '@playwright/test'

/**
 * Sweeps every desk route in the newsroom admin as a signed-in admin.
 *
 * The lifecycle spec next door covers one path through the editorial workflow
 * in depth. Nothing covered the other thirty-odd desks at all, which is how a
 * desk can start throwing and nobody finds out until an editor opens it
 * mid-shift. This is deliberately shallow and wide: for each route, did it
 * answer 200, did it render its own chrome rather than an error boundary, and
 * did the client stay quiet.
 *
 * Routes are listed by hand rather than globbed off the filesystem. A glob
 * would make the test pass automatically for a route nobody thought about,
 * and the point is to force a decision when a desk is added.
 */

const ADMIN = { email: 'admin@local.test', password: 'local-admin-only' }

/** Every desk route, minus the ones that need a record id. */
const DESK_ROUTES = [
  '/admin/dashboard',
  '/admin/articles',
  '/admin/articles/new',
  '/admin/ads',
  '/admin/algorithms',
  '/admin/audit-log',
  '/admin/authors',
  '/admin/categories',
  '/admin/comments',
  '/admin/contact',
  '/admin/corrections',
  '/admin/editor-preferences',
  '/admin/experiments',
  '/admin/journalists',
  '/admin/launch',
  '/admin/live',
  '/admin/live-blogs',
  '/admin/live-widgets',
  '/admin/media',
  '/admin/newsletter',
  '/admin/paywall',
  '/admin/polls',
  '/admin/provinces',
  '/admin/roles',
  '/admin/search-analytics',
  '/admin/seo',
  '/admin/session-quality',
  '/admin/settings',
  '/admin/submissions',
  '/admin/tags',
  '/admin/topics',
  '/admin/users',
  '/admin/wire',
] as const

/**
 * Sign in through the API rather than the form. The form is the lifecycle
 * spec's subject; here it is just setup, and driving it would make every one
 * of these cases fail for the same unrelated reason if the form regressed.
 */
async function signInAsAdmin(page: Page) {
  await page.goto('/admin/login')
  const body = await page.evaluate(async (creds) => {
    const res = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(creds),
    })
    return { status: res.status, text: await res.text() }
  }, ADMIN)
  expect(body.status, `admin sign-in failed: ${body.text}`).toBeLessThan(400)
}

test.describe('newsroom admin desks', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsAdmin(page)
  })

  for (const route of DESK_ROUTES) {
    test(`${route} renders for an admin`, async ({ page }) => {
      // Console errors are collected rather than asserted per-message so the
      // failure names every problem on the desk at once instead of the first.
      const consoleErrors: string[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))

      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), `${route} did not answer 200`).toBe(200)

      // The admin shell is a client component, so this only exists once
      // hydration has run; waiting on it doubles as a hydration check.
      // `data-desk` carries the resolved role variant and is already
      // load-bearing for the shell's own styling, so it will not be dropped as
      // an unused test hook. The shell puts it on both the outer surface and
      // the sidebar, so scope to the surface rather than taking `.first()` --
      // this should fail if the outer shell stops rendering, even when the
      // sidebar still does.
      await expect(page.locator('.admin-shell-surface[data-desk]')).toBeVisible()

      // The desk error boundary and the global one both surface as this copy.
      // Matching the rendered text catches a boundary that still answered 200.
      const text = await page.locator('body').innerText()
      expect(text, `${route} rendered an error boundary`).not.toContain('पृष्ठ लोड हुन सकेन')

      // Next's dev overlay swallows nothing, so a hydration mismatch shows up
      // here as #418 and a server render failure as #441.
      const reactErrors = [...consoleErrors, ...pageErrors].filter((message) =>
        /Minified React error #(418|423|425|441)|Hydration failed/.test(message),
      )
      expect(reactErrors, `${route} hydrated with React errors`).toEqual([])
      expect(pageErrors, `${route} threw on the client`).toEqual([])
    })
  }
})
