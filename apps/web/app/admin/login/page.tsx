import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getNewsroomSession } from '@/lib/auth/session'
import { Logo } from '@/components/Logo'
import { probeDatabase } from '@/lib/db-url'
import { AdminLoginForm } from './AdminLoginForm'

export const metadata: Metadata = {
  title: 'Newsroom Login',
  description: 'Staff-only sign in to the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const [session, query, database] = await Promise.all([
    getNewsroomSession(),
    searchParams,
    probeDatabase(),
  ])
  if (session) redirect('/admin/dashboard')

  return (
    <main className="auth-shell auth-shell--newsroom">
      <section className="auth-editorial auth-editorial--newsroom" aria-label="Newsroom introduction">
        <a href="/" className="auth-editorial__brand" aria-label="Nagarik Watch home">
          <Logo siteName="नागरिक वाच" />
        </a>
        <div className="auth-editorial__copy">
          <p className="auth-editorial__mark" lang="ne">
            नागरिक वाच
          </p>
          <p className="auth-editorial__eyebrow" lang="en">
            Newsroom
          </p>
          <h1 lang="ne">सम्पादकीय डेस्क</h1>
          <p lang="ne">
            स्टाफ-only प्रवेश। पाठक खाताबाट अलग। भूमिकाअनुसार लेख्ने, समीक्षा गर्ने र प्रकाशन गर्ने अधिकार।
          </p>
        </div>
        <p className="auth-editorial__foot" lang="en">
          Nagarik Watch · Staff access
        </p>
      </section>

      <section className="auth-form-column">
        <div className="auth-form-wrap">
          <a href="/" className="mb-8 block w-fit lg:hidden">
            <Logo siteName="नागरिक वाच" />
          </a>
          <p className="admin-eyebrow" lang="en">
            Staff sign in
          </p>
          <h2 className="mt-2 font-display text-[2.2rem] font-extrabold leading-tight text-ink" lang="ne">
            न्युजरुममा प्रवेश
          </h2>
          <p className="mt-3 max-w-md text-body leading-relaxed text-ink-soft" lang="ne">
            संस्थागत इमेल र पासवर्ड प्रयोग गर्नुहोस्। पहुँच भूमिकाअनुसार सीमित हुन्छ।
          </p>

          {!database.ok ? (
            <aside
              className="mt-5 rounded-md border border-breaking/35 bg-brand-tint px-4 py-3 text-meta text-brand-strong"
              role="status"
              lang="ne"
            >
              <p className="font-bold">खाता डाटाबेस अफलाइन छ</p>
              <p className="mt-1 leading-relaxed">
                {!database.host
                  ? 'DATABASE_URL सेट छैन। Vercel → Project → Settings → Environment Variables मा Postgres URL राखेर Redeploy गर्नुहोस्।'
                  : database.code === 'ENOTFOUND'
                    ? `होस्ट \`${database.host}\` DNS बाट फेला परेन। सेवा अनलाइन भएपछि पुनः प्रयास गर्नुहोस्।`
                    : database.code === 'SSL' || /certificate|TLS/i.test(database.detail)
                      ? `होस्ट \`${database.host}\` पुग्यो तर TLS प्रमाणपत्र अस्वीकार भयो। Redeploy पछि Aiven SSL फिक्स लागू हुन्छ।`
                      : `होस्ट \`${database.host}\` मा जडान असफल। सेवा, पासवर्ड र SSL जाँच्नुहोस्।`}
              </p>
              <p className="mt-2 text-caption text-ink-soft" lang="en">
                {database.detail}
              </p>
            </aside>
          ) : null}

          <div className="auth-form-surface">
            <AdminLoginForm resetComplete={query.reset === 'success'} databaseOnline={database.ok} />
          </div>
          <p className="mt-8 text-caption text-mute" lang="ne">
            पाठक हुनुहुन्छ?{' '}
            <a href="/auth/login" className="font-bold text-brand-strong hover:underline">
              पाठक लगइन
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}
