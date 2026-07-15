import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { getNewsroomSession } from '@/lib/auth/session'
import { getBootLoginHint } from '@/lib/auth/boot-accounts'
import { Logo } from '@/components/Logo'
import { probeDatabase } from '@/lib/db-url'
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
  await getAuth().catch((error) => {
    console.error('[admin/login] getAuth failed', error)
    return null
  })
  const [session, query, database, boot] = await Promise.all([
    getNewsroomSession(),
    searchParams,
    probeDatabase(),
    getBootLoginHint(),
  ])
  if (session) redirect('/admin/dashboard')

  const bootReady = boot.configured && boot.provisionedCount > 0

  return (
    <main className="staff-gate" lang="ne">
      <div className="staff-gate__card">
        <Link href="/" className="staff-gate__brand" aria-label="नागरिक वाच गृहपृष्ठ">
          <Logo siteName="नागरिक वाच" />
        </Link>

        <header className="staff-gate__header">
          <h1>न्युजरुम लगइन</h1>
          <p>सम्पादक र एडमिनका लागि मात्र।</p>
        </header>

        {!database.ok ? (
          <aside className="newsroom-login-form__error" role="status">
            <strong>डाटाबेस अफलाइन।</strong>
            <span style={{ display: 'block', marginTop: '0.35rem' }}>{database.detail}</span>
          </aside>
        ) : null}

        {database.ok && boot.configured && !bootReady ? (
          <aside className="newsroom-login-form__error" role="status">
            <strong>स्टाफ खाता तयार हुँदैछ।</strong>
            <span style={{ display: 'block', marginTop: '0.35rem' }}>
              पृष्ठ रिफ्रेस गर्नुहोस् र फेरि प्रयास गर्नुहोस्।
            </span>
          </aside>
        ) : null}

        <AdminLoginForm
          resetComplete={query.reset === 'success'}
          databaseOnline={database.ok}
          expectedEmails={boot.maskedEmails}
        />

        <p className="staff-gate__footer">
          <Link href="/">← गृहपृष्ठ</Link>
          <Link href="/auth/forgot-password?next=%2Fadmin%2Flogin">पासवर्ड भुल्नुभयो?</Link>
        </p>
      </div>
    </main>
  )
}
