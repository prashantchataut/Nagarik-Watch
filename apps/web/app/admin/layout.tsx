import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import '../globals.css'
import { fontVariables } from '../fonts'
import { requireNewsroomSession } from '@/lib/auth/session'
import { notFound } from 'next/navigation'
import type { NewsroomSession } from '@/lib/auth/session'
import { canAccessAdminPath } from '@/lib/admin-roles'

export const metadata: Metadata = {
  title: 'Newsroom Admin',
  description: 'Nagarik Watch newsroom admin.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Admin layout. Guards every /admin/* route (except /admin/login) by requiring
 * a signed-in newsroom session.
 *
 * Branching:
 *   - /admin/login → standalone full-page chrome, no session gate, no sidebar.
 *   - /admin/* (everything else) → session-gated AdminShell with sidebar.
 *
 * ENABLE_WEB_ADMIN_SCAFFOLD gates whether the newsroom section is reachable at
 * all. When unset (the default), every /admin/* except login shows an "enable
 * the flag" notice. When set, the session check takes over. The login page is
 * always reachable so the founder can configure auth.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const h = await headers()
  const pathname = h.get('x-pathname') ?? ''
  const isLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/')

  // Login page: standalone chrome, no gate.
  if (isLogin) {
    return (
      <html lang="ne" className={fontVariables} suppressHydrationWarning>
        <body className="min-h-screen bg-surface text-ink font-sans antialiased">{children}</body>
      </html>
    )
  }

  // Scaffold flag gate: launch builds should not accidentally hide the admin panel.
  // Only an explicit "false" disables the custom newsroom admin; unset/default means enabled.
  if (process.env.ENABLE_WEB_ADMIN_SCAFFOLD === 'false') {
    return (
      <html lang="en" className={fontVariables} suppressHydrationWarning>
        <body className="min-h-screen bg-surface text-ink font-sans antialiased">
          <div className="mx-auto max-w-md px-4 py-20 text-center">
            <h1 className="font-display text-h1 text-ink">Newsroom admin is disabled</h1>
            <p className="mt-3 text-body text-ink-soft">
              Set{' '}
              <code className="rounded bg-brand-tint px-1.5 py-0.5 text-brand-strong">
                ENABLE_WEB_ADMIN_SCAFFOLD=true
              </code>{' '}
              in your environment to enable the newsroom admin. The reader-facing site is
              unaffected.
            </p>
            <a
              href="/admin/login"
              className="mt-6 inline-block rounded-full bg-brand px-5 py-2.5 text-body font-semibold text-surface"
            >
              Go to login
            </a>
          </div>
        </body>
      </html>
    )
  }

  // All other /admin/* routes require a newsroom session and a server-side
  // route permission check. Sidebar filtering is only a convenience; this is
  // the enforcement point for sensitive operations screens.
  const session: NewsroomSession = await requireNewsroomSession()
  if (!canAccessAdminPath(session.newsroomRole, pathname)) notFound()
  const { AdminShell } = await import('@/components/admin/AdminShell')

  return (
    <html lang="ne" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">
        <AdminShell session={session} pathname={pathname}>
          {children}
        </AdminShell>
      </body>
    </html>
  )
}
