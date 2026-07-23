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
    <main className="newsroom-login newsroom-login--admin" lang="en">
      <div className="newsroom-login__mast">
        <Link href="/" aria-label="Nagarik Watch home">
          <Logo siteName="नागरिक वाच" />
        </Link>
        <span>Ops console</span>
      </div>

      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <p className="newsroom-login__kicker">Staff only</p>
          <h1>Newsroom login</h1>
          <p>
            Editors, publishers, and admins manage publishing, roles, and live desks here.
            Reporter drafts live on the journalist desk.
          </p>
          <dl aria-label="What you can do">
            <div>
              <dt>01</dt>
              <dd>Publish queue and CMS</dd>
            </div>
            <div>
              <dt>02</dt>
              <dd>Roles, invites, audit</dd>
            </div>
            <div>
              <dt>03</dt>
              <dd>Live blogs and widgets</dd>
            </div>
            <div>
              <dt>04</dt>
              <dd>Ads, SEO, launch checks</dd>
            </div>
          </dl>
        </section>

        <section className="newsroom-login__form">
          <header>
            <p className="newsroom-login__kicker">Sign in</p>
            <h2>Open the console</h2>
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
                {boot.lastError} Use the NEWSROOM_* email/password from env.
              </span>
            </aside>
          ) : null}

          {authReady && boot.configured && boot.maskedEmails.length > 0 ? (
            <p className="newsroom-login-form__ok" lang="en">
              Boot account: {boot.maskedEmails.join(', ')}
            </p>
          ) : null}

          {authReady ? (
            <AdminLoginForm resetComplete={query.reset === 'success'} databaseOnline={authReady} />
          ) : null}

          <footer>
            <Link href="/">← Home</Link>
            <Link href="/ne/journalist/login">Journalist desk</Link>
            <Link href="/auth/forgot-password?next=%2Fadmin%2Flogin">Forgot password?</Link>
          </footer>
        </section>
      </div>
    </main>
  )
}
