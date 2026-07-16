import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { getNewsroomSession } from '@/lib/auth/session'
import { ensureNewsroomBootAccounts, getBootLoginHint } from '@/lib/auth/boot-accounts'
import { Logo } from '@/components/Logo'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Newsroom Login · नागरिक वाच',
  description: 'Staff-only sign in to the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  // Create auth + repair boot accounts before the form is usable. Skipping
  // password sync left existing NEWSROOM_* users returning 401 forever.
  let authReady = false
  try {
    const auth = await getAuth()
    await ensureNewsroomBootAccounts(
      auth as unknown as Parameters<typeof ensureNewsroomBootAccounts>[0],
    )
    authReady = true
  } catch (error) {
    console.error('[admin/login] auth/boot failed', error)
  }

  const [session, query, boot] = await Promise.all([
    getNewsroomSession(),
    searchParams,
    getBootLoginHint(),
  ])
  if (session) redirect('/admin/dashboard')

  return (
    <main className="staff-gate" lang="en">
      <div className="staff-gate__card">
        <Link href="/" className="staff-gate__brand" aria-label="Nagarik Watch home">
          <Logo siteName="नागरिक वाच" />
        </Link>

        <header className="staff-gate__header">
          <h1>Newsroom login</h1>
          <p>Editors and admins only.</p>
        </header>

        {!authReady ? (
          <aside className="newsroom-login-form__error" role="status">
            <strong>Auth offline.</strong>
            <span style={{ display: 'block', marginTop: '0.35rem' }}>
              Check DATABASE_URL and try again.
            </span>
          </aside>
        ) : null}

        {authReady && boot.lastError ? (
          <aside className="newsroom-login-form__error" role="status" style={{ opacity: 0.9 }}>
            <strong>Account repair incomplete.</strong>
            <span style={{ display: 'block', marginTop: '0.35rem' }}>
              {boot.lastError} Use the NEWSROOM_* email/password from Vercel env.
            </span>
          </aside>
        ) : null}

        {authReady && boot.configured && boot.maskedEmails.length > 0 ? (
          <p className="text-caption text-mute" style={{ marginBottom: '1rem' }} lang="en">
            Boot account: {boot.maskedEmails.join(', ')}
          </p>
        ) : null}

        <AdminLoginForm resetComplete={query.reset === 'success'} databaseOnline={authReady} />

        <p className="staff-gate__footer">
          <Link href="/">← Home</Link>
          <Link href="/auth/forgot-password?next=%2Fadmin%2Flogin">Forgot password?</Link>
        </p>
      </div>
    </main>
  )
}
