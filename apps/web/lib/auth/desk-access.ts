import 'server-only'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { adminPathOutcome, type NewsroomRole } from '@/lib/admin-roles'

/**
 * Desk authorization has to be enforced per request, not per layout render.
 *
 * It used to live only in `app/admin/(desk)/layout.tsx`, which reads the
 * pathname from the `x-pathname` header the proxy sets. That is correct exactly
 * once: on a full page load. App Router layouts are not re-rendered on
 * client-side navigation -- a navigation request returns only the segments that
 * changed, and the shared layout is reused from the router cache. Instrumenting
 * the layout with a `console.error` and driving a sidebar click under Playwright
 * showed one `[LAYOUT-RUN] /admin/dashboard` for the hard load and nothing at
 * all for the soft navigation to `/admin/articles`.
 *
 * So every desk reachable by soft navigation was rendering without its role
 * rule ever being consulted, and the pages themselves only called
 * `requireNewsroomSession()` -- authentication, not authorization. Two ways that
 * bites:
 *
 *   - A demoted account keeps its old reach until something forces a full
 *     reload.
 *   - Any authenticated staff account can ask for a desk it has no rule for by
 *     issuing the navigation request itself, and get back the server-rendered
 *     payload -- the user list, the audit log -- because the only check that
 *     would have stopped it is in a layout the request never re-renders.
 *
 * Pages, unlike layouts, always run. Hanging the check off
 * `requireNewsroomSession()` therefore puts it somewhere no desk can skip,
 * including server actions, whose POST carries the desk's own pathname.
 */

/** Where a journalist-desk role belongs when it asks for an editor desk. */
const JOURNALIST_DESK_HOME = '/ne/journalist/dashboard'

/**
 * The admin pathname for *this* request, or null when the request is not an
 * admin-shell request.
 *
 * `x-nw-shell` is set to `admin` by both `proxy.ts` and the slim Cloudflare
 * middleware, for `/admin` and `/admin/*` only, with `set` rather than an
 * append -- so a client cannot forge it onto a non-admin route to have the
 * check skipped, and cannot strip it from an admin route to the same effect.
 *
 * Returning null for everything else is what keeps this out of the way of the
 * journalist desk and the reader account pages, which call
 * `requireNewsroomSession()` too and must not be measured against admin rules.
 * Admin *API* routes are also excluded: they are outside the shell, their paths
 * are `/api/admin/...`, and `ADMIN_PATH_ROLE_RULES` is keyed on `/admin/...`
 * prefixes. They keep their own checks -- see roadmap 7.8.
 */
async function adminRequestPathname(): Promise<string | null> {
  const requestHeaders = await headers()
  if (requestHeaders.get('x-nw-shell') !== 'admin') return null
  const pathname = requestHeaders.get('x-pathname')
  if (!pathname || !pathname.startsWith('/admin')) return null
  return pathname
}

/**
 * Throws (redirect or 404) unless `role` may see the desk this request is for.
 * A no-op outside the admin shell.
 */
export async function enforceAdminDeskAccess(role: NewsroomRole): Promise<void> {
  const pathname = await adminRequestPathname()
  if (!pathname) return
  const outcome = adminPathOutcome(role, pathname)
  if (outcome === 'allow') return
  if (outcome === 'journalist-desk') redirect(JOURNALIST_DESK_HOME)
  // `notFound` rather than a 403: a desk this account may not open should not
  // confirm that it exists. Matches what the layout did on a hard load.
  notFound()
}
