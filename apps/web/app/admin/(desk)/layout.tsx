import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { requireNewsroomSession } from '@/lib/auth/session'
import { isPayloadCanonical, payloadAdminUrl } from '@/lib/content/payload-admin-client'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export default async function AdminDeskLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers()
  const pathname =
    requestHeaders.get('x-pathname') ??
    requestHeaders.get('x-invoke-path') ??
    requestHeaders.get('next-url')?.replace(/^https?:\/\/[^/]+/, '') ??
    '/admin'

  if (process.env.ENABLE_WEB_ADMIN_SCAFFOLD === 'false') {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="section-kicker">Newsroom</p>
        <h1 className="font-display text-h1 text-ink">Newsroom admin is disabled</h1>
        <p className="mt-4 text-body text-ink-soft">
          Set ENABLE_WEB_ADMIN_SCAFFOLD=true to enable protected newsroom routes.
        </p>
        {/* Full navigation on purpose: the scaffold is disabled, so this route
            group's client bundle should not be kept alive across the jump. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/admin/login"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-sm bg-brand px-5 font-semibold text-on-brand"
        >
          Open login
        </a>
      </main>
    )
  }

  // The role rules used to be applied here. They are not, any more: this layout
  // is rendered on a full page load and then reused across every client-side
  // navigation, so a check here covered the first desk an editor opened and no
  // others. `requireNewsroomSession` now enforces them for every request that
  // carries the admin shell header, which is every desk page and every desk
  // server action. See `lib/auth/desk-access.ts` for the evidence.
  const session = await requireNewsroomSession()
  const contentAdminUrl = isPayloadCanonical() ? payloadAdminUrl() : undefined
  return (
    <AdminShell session={session} pathname={pathname} contentAdminUrl={contentAdminUrl}>
      {children}
    </AdminShell>
  )
}
