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

/** `section_editor`. Runs the editorial desks; not a USER_MANAGER_ROLE. */
const EDITOR = { email: 'editor@local.test', password: 'local-editor-only' }

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
async function signIn(page: Page, creds: { email: string; password: string }) {
  await page.goto('/admin/login')
  const body = await page.evaluate(async (payload) => {
    const res = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return { status: res.status, text: await res.text() }
  }, creds)
  expect(body.status, `sign-in failed for ${creds.email}: ${body.text}`).toBeLessThan(400)
}

test.describe('newsroom admin desks', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ADMIN)
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

/**
 * Desk role rules have to hold on a client-side navigation, not only on a full
 * page load.
 *
 * They used to live in `app/admin/(desk)/layout.tsx`. App Router does not
 * re-render a shared layout when the router moves between its children --
 * instrumenting the layout showed one run for the hard load of
 * `/admin/dashboard` and none at all for a sidebar click through to
 * `/admin/articles`. So the rules were applied to the first desk an editor
 * opened and to nothing after it, and the desk pages themselves only called
 * `requireNewsroomSession()`, which authenticates without authorizing.
 *
 * Driving that through the UI is not possible from a test: Next's `Link` pushes
 * the `href` it was given as a prop, so rewriting the DOM attribute and clicking
 * re-pushes the original, and `history.pushState` moves the URL without
 * fetching a new segment. So replay the navigation request itself. The
 * `Next-Router-State-Tree` is captured from a real sidebar click rather than
 * hardcoded, which is both faithful and version-proof: it tells the server the
 * client already holds the `(desk)` layout, which is the exact condition that
 * made the layout's check unreachable.
 *
 * The allowed desk is a positive control, and it is the part that keeps this
 * test honest. Without it, the two denials would also pass if the replay
 * silently stopped returning desk content for any reason.
 */
test.describe('desk authorization on a navigation request', () => {
  /** Distinctive copy from each desk's own body, not its <title>. */
  const ALLOWED = { route: '/admin/articles', marker: 'समाचार कक्षको सामग्री सूची' }
  const DENIED = [
    { route: '/admin/users', marker: 'भूमिका र निष्क्रियता व्यवस्थापन' },
    { route: '/admin/audit-log', marker: 'Sensitive newsroom actions' },
  ]

  /** Flight payloads escape non-ASCII, so Devanagari arrives as \uXXXX. */
  function decode(payload: string): string {
    return payload.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
  }

  test('a section editor gets its own desks and not the ones it has no rule for', async ({
    page,
  }) => {
    await signIn(page, EDITOR)
    await page.goto('/admin/dashboard')
    await expect(page.locator('.admin-shell-surface[data-desk]')).toBeVisible()

    let stateTree: string | undefined
    page.on('request', (request) => {
      const headers = request.headers()
      if (headers['rsc'] === '1' && !headers['next-router-prefetch'] && !stateTree) {
        stateTree = headers['next-router-state-tree']
      }
    })
    await page.locator(`.admin-sidebar a[href="${ALLOWED.route}"]`).first().click()
    await expect(page).toHaveURL(new RegExp(ALLOWED.route.replaceAll('/', '\\/')))
    await expect.poll(() => stateTree).toBeTruthy()

    async function replay(route: string): Promise<string> {
      const response = await page.request.get(route, {
        headers: {
          RSC: '1',
          'Next-Router-State-Tree': stateTree as string,
          'Next-Url': '/admin/dashboard',
        },
      })
      return decode(await response.text())
    }

    // Positive control: the replay does deliver desk bodies for a desk this
    // role owns. If this ever fails, the denials below prove nothing.
    expect(await replay(ALLOWED.route), 'replay no longer returns desk content').toContain(
      ALLOWED.marker,
    )

    for (const { route, marker } of DENIED) {
      expect(await replay(route), `${route} rendered for a role with no rule for it`).not.toContain(
        marker,
      )
    }

    // Also not reachable by a full load, which is what always worked.
    for (const { route, marker } of DENIED) {
      await page.goto(route)
      expect(await page.locator('body').innerText()).not.toContain(marker)
    }
  })
})
