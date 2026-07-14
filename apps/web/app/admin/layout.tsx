import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { requireNewsroomSession, type NewsroomSession } from '@/lib/auth/session'
import { canAccessAdminPath } from '@/lib/admin-roles'
import { isPayloadCanonical, payloadAdminUrl } from '@/lib/content/payload-admin-client'

export const metadata: Metadata = {
  title: 'Newsroom Admin',
  description: 'Nagarik Watch newsroom admin.',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? ''
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return children

  if (process.env.ENABLE_WEB_ADMIN_SCAFFOLD === 'false') {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <p className="section-kicker">Newsroom</p>
        <h1 className="font-display text-h1 text-ink">Newsroom admin is disabled</h1>
        <p className="mt-4 text-body text-ink-soft">Set ENABLE_WEB_ADMIN_SCAFFOLD=true to enable protected newsroom routes.</p>
        <a href="/admin/login" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md bg-brand px-5 font-semibold text-surface">Open login</a>
      </main>
    )
  }

  const session: NewsroomSession = await requireNewsroomSession()
  if (!canAccessAdminPath(session.newsroomRole, pathname)) notFound()
  const { AdminShell } = await import('@/components/admin/AdminShell')
  const contentAdminUrl = isPayloadCanonical() ? payloadAdminUrl() : undefined
  return (
    <AdminShell session={session} pathname={pathname} contentAdminUrl={contentAdminUrl}>
      {children}
    </AdminShell>
  )
}
