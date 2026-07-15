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
  // Force cold-start boot provisioning before the form renders so a restored
  // Aiven instance actually has the NEWSROOM_* accounts for this request.
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
    <main className="newsroom-login newsroom-login--admin" lang="ne">
      <div className="newsroom-login__mast">
        <Link href="/" aria-label="नागरिक वाच गृहपृष्ठ">
          <Logo siteName="नागरिक वाच" />
        </Link>
        <span>Editorial desk · staff only</span>
      </div>

      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <p className="editorial-kicker" lang="en">
            Nagarik Watch newsroom
          </p>
          <h1>सम्पादकीय डेस्कमा फर्कनुहोस्।</h1>
          <p>
            यो पाठक लगइन होइन। स्टाफ खाताबाट लेख सम्पादन, समीक्षा, प्रकाशन र प्रयोगकर्ता व्यवस्थापन हुन्छ।
            भूमिकाअनुसार पहुँच सीमित छ।
          </p>
          <dl>
            <div>
              <dt>01</dt>
              <dd>सुपर/एडमिन·NEWSROOM_* बाट स्वतः तयार</dd>
            </div>
            <div>
              <dt>02</dt>
              <dd>पत्रकार डेस्क अलग · /journalist</dd>
            </div>
            <div>
              <dt>03</dt>
              <dd>पाठक खाताले यहाँ प्रवेश पाउँदैन</dd>
            </div>
          </dl>
        </section>

        <section className="newsroom-login__form">
          <header>
            <p className="editorial-kicker" lang="en">
              Staff sign in
            </p>
            <h2>न्युजरुम प्रवेश</h2>
            <p>Vercel मा राखेको NEWSROOM_SUPERADMIN वा NEWSROOM_ADMIN इमेल/पासवर्ड प्रयोग गर्नुहोस्।</p>
          </header>

          {!database.ok ? (
            <aside className="newsroom-login-form__error" role="status" style={{ marginBottom: '1rem' }}>
              <strong>डाटाबेस अफलाइन।</strong>
              <span style={{ display: 'block', marginTop: '0.35rem' }}>{database.detail}</span>
            </aside>
          ) : null}

          {database.ok && boot.configured && !bootReady ? (
            <aside className="newsroom-login-form__error" role="status" style={{ marginBottom: '1rem' }}>
              <strong>स्टाफ खाता अझै तयार भएन।</strong>
              <span style={{ display: 'block', marginTop: '0.35rem' }}>
                अपेक्षित: {boot.maskedEmails.join(' · ') || 'env इमेल'}। पृष्ठ रिफ्रेस गर्नुहोस्; पहिलो अनुरोधले खाता बनाउँछ।
              </span>
              {boot.lastError ? (
                <span style={{ display: 'block', marginTop: '0.35rem' }} lang="en">
                  {boot.lastError}
                </span>
              ) : null}
            </aside>
          ) : null}

          {database.ok && bootReady ? (
            <p className="text-caption text-mute" style={{ marginBottom: '1rem' }} lang="en">
              Ready accounts: {boot.maskedEmails.join(' · ')}
            </p>
          ) : null}

          <AdminLoginForm
            resetComplete={query.reset === 'success'}
            databaseOnline={database.ok}
            expectedEmails={boot.maskedEmails}
          />

          <footer>
            <Link href="/auth/forgot-password?next=%2Fadmin%2Flogin">पासवर्ड भुल्नुभयो?</Link>
            <Link href="/journalist/login">पत्रकार डेस्क</Link>
            <Link href="/auth/login">पाठक लगइन</Link>
          </footer>
        </section>
      </div>
    </main>
  )
}
