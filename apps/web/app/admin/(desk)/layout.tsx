import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canAccessAdminPath, isJournalistDeskRole } from '@/lib/admin-roles'
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
        <a
          href="/admin/login"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-sm bg-brand px-5 font-semibold text-paper"
        >
          Open login
        </a>
      </main>
    )
  }

  const session = await requireNewsroomSession()
  if (isJournalistDeskRole(session.newsroomRole)) {
    redirect('/ne/journalist/dashboard')
  }
  if (!canAccessAdminPath(session.newsroomRole, pathname)) notFound()
  const contentAdminUrl = isPayloadCanonical() ? payloadAdminUrl() : undefined
  return (
    <AdminShell session={session} pathname={pathname} contentAdminUrl={contentAdminUrl}>
      {children}
    </AdminShell>
  )
}
