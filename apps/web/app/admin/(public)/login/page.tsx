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
  // Create auth before the form is usable. Boot password sync can take seconds on a
  // cold Postgres link — race it so the form still appears quickly.
  let authReady = false
  try {
    const auth = await getAuth()
    authReady = true
    await Promise.race([
      ensureNewsroomBootAccounts(
        auth as unknown as Parameters<typeof ensureNewsroomBootAccounts>[0],
      ),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 2500)
      }),
    ])
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
    <main className="newsroom-login newsroom-login--admin" lang="ne">
      <div className="newsroom-login__mast">
        <Link href="/" aria-label="नागरिक वाच गृहपृष्ठ">
          <Logo siteName="नागरिक वाच" />
        </Link>
        <span>न्युजरुम</span>
      </div>

      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <h1>सम्पादकीय लगइन</h1>
          <p>
            सम्पादक, प्रकाशक र एडमिन यहाँबाट प्रकाशन, भूमिका र लाइभ डेस्क चलाउँछन्।
            रिपोर्टिङ ड्राफ्ट पत्रकार डेस्कमा हुन्छ।
          </p>
          <ul className="mt-6 space-y-2 text-meta text-ink-soft">
            <li>प्रकाशन कतार र CMS</li>
            <li>भूमिका, निमन्त्रणा, अडिट</li>
            <li>लाइभ ब्लग र विजेट</li>
          </ul>
        </section>

        <section className="newsroom-login__form">
          <header>
            <h2>साइन इन</h2>
            <p>स्टाफ खाता मात्र।</p>
          </header>

          {!authReady ? (
            <aside className="newsroom-login-form__error" role="status">
              <strong>लगइन सेवा अफलाइन।</strong>
              <span style={{ display: 'block', marginTop: '0.35rem' }}>
                DATABASE_URL जाँच्नुहोस्।
              </span>
            </aside>
          ) : null}

          {authReady && boot.lastError ? (
            <aside className="newsroom-login-form__error" role="status" style={{ opacity: 0.9 }}>
              <strong>खाता मर्मत अधुरो।</strong>
              <span style={{ display: 'block', marginTop: '0.35rem' }}>
                NEWSROOM_* इमेल/पासवर्ड प्रयोग गर्नुहोस्।
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
            <Link href="/">← गृहपृष्ठ</Link>
            <Link href="/journalist/login">पत्रकार डेस्क</Link>
            <Link href="/auth/forgot-password?next=%2Fadmin%2Flogin">पासवर्ड बिर्सनुभयो?</Link>
          </footer>
        </section>
      </div>
    </main>
  )
}
