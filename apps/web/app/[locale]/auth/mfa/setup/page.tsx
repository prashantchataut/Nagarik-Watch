import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Newsroom MFA setup',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-static'

/**
 * MFA setup needs a live auth host; keep a clear static page instead of a dead redirect.
 * Visual language matches staff login entrance (Operate desk, not marketing).
 */
export default async function StaffMfaSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  return (
    <main className="newsroom-login newsroom-login--admin" lang={ne ? 'ne' : 'en'}>
      <div className="newsroom-login__mast">
        <Link
          href={localizeHref(locale, '/')}
          aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}
        >
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
        </Link>
        <span className="newsroom-login__badge">{ne ? 'सुरक्षा' : 'Security'}</span>
      </div>

      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <h1>{ne ? 'दुई चरणीय प्रमाणीकरण' : 'Two-factor authentication'}</h1>
          <span className="newsroom-login__brief-rule" aria-hidden="true" />
          <p>
            {ne
              ? 'MFA सेटअप पूर्ण एप होस्टमा मात्र चल्छ। पाठक लगइन र सुरक्षित समाचार अझै उपलब्ध छन्।'
              : 'MFA setup runs on the full app host only. Reader sign-in and saved stories remain available.'}
          </p>
          <ul className="newsroom-login__points">
            <li>
              {ne ? 'स्थैतिक साइटमा सत्र API हुँदैन' : 'Static hosts cannot run session APIs'}
            </li>
            <li>
              {ne
                ? 'पूर्ण Workers डेप्लोयमा सेटअप खोल्नुहोस्'
                : 'Open setup on the full Workers deploy'}
            </li>
          </ul>
        </section>

        <section className="newsroom-login__form">
          <header>
            <h2>{ne ? 'अर्को कदम' : 'Next step'}</h2>
            <p>
              {ne
                ? 'पाठक खाता वा गृहपृष्ठबाट जारी राख्नुहोस्।'
                : 'Continue from reader account or the home page.'}
            </p>
          </header>
          <div className="mt-4 grid gap-2">
            <Link
              href={localizeHref(locale, '/auth/login')}
              className="newsroom-login-form__submit"
            >
              {ne ? 'पाठक लगइन' : 'Reader sign-in'}
            </Link>
            <Link
              href={localizeHref(locale, '/')}
              className="inline-flex min-h-11 items-center justify-center border border-rule px-4 text-meta font-bold text-ink hover:border-brand hover:text-brand-strong"
            >
              {ne ? 'गृहपृष्ठ' : 'Home'}
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
