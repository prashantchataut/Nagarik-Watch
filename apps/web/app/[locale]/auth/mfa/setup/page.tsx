import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { StaffMfaSetup } from '@/components/auth/StaffMfaSetup'
import { getUnverifiedNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { twoFactorConfigured } from '@/lib/security/mfa'

export const metadata: Metadata = {
  title: 'Newsroom MFA setup',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function StaffMfaSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getUnverifiedNewsroomSession()

  if (!session) redirect('/admin/login')
  if (session.twoFactorEnabled) redirect('/admin/dashboard')

  const configured = twoFactorConfigured()

  return (
    <main className="newsroom-login newsroom-login--admin" lang={ne ? 'ne' : 'en'}>
      <div className="newsroom-login__mast">
        <Link
          href={localizeHref(locale, '/')}
          aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}
        >
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
        </Link>
        <span className="newsroom-login__badge">{ne ? 'न्यूजरुम सुरक्षा' : 'Newsroom security'}</span>
      </div>

      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <h1>{ne ? 'दुई चरणीय प्रमाणीकरण' : 'Two-factor authentication'}</h1>
          <span className="newsroom-login__brief-rule" aria-hidden="true" />
          <p>
            {ne
              ? 'न्यूजरुम खाताका लागि authenticator app मार्फत थप सुरक्षा सक्रिय गर्नुहोस्।'
              : 'Add an authenticator app as a second factor for your newsroom account.'}
          </p>
          <ul className="newsroom-login__points">
            <li>{ne ? 'QR code authenticator app मा स्क्यान गर्नुहोस्' : 'Scan the QR code in an authenticator app'}</li>
            <li>{ne ? 'Recovery codes सुरक्षित स्थानमा राख्नुहोस्' : 'Store recovery codes somewhere secure'}</li>
            <li>{ne ? '६-अङ्कको code पुष्टि गरेर डेस्कमा फर्कनुहोस्' : 'Verify a 6-digit code to return to the desk'}</li>
          </ul>
        </section>

        <section className="newsroom-login__form">
          <header>
            <h2>{ne ? 'MFA सक्रिय गर्नुहोस्' : 'Activate MFA'}</h2>
            <p>
              {ne
                ? 'पहिले आफ्नो हालको पासवर्ड पुष्टि गर्नुहोस्।'
                : 'Confirm your current password first.'}
            </p>
          </header>

          {configured ? (
            <div className="mt-5">
              <StaffMfaSetup locale={locale} />
            </div>
          ) : (
            <div className="mt-5 border border-rule bg-surface-raised p-4">
              <p className="text-meta font-semibold text-ink">
                {ne
                  ? 'यो deployment मा staff MFA enforcement सक्रिय गरिएको छैन।'
                  : 'Staff MFA enforcement is not enabled on this deployment.'}
              </p>
              <p className="mt-2 text-caption leading-relaxed text-ink-soft">
                {ne
                  ? 'Operator ले STAFF_MFA_ENABLED=true सेट गरेर redeploy गरेपछि enrollment उपलब्ध हुन्छ।'
                  : 'An operator must set STAFF_MFA_ENABLED=true and redeploy before enrollment is available.'}
              </p>
              <Link
                href="/admin/login"
                className="mt-4 inline-flex min-h-11 items-center justify-center border border-rule px-4 text-meta font-bold text-ink hover:border-brand hover:text-brand-strong"
              >
                {ne ? 'न्यूजरुम लगइनमा फर्कनुहोस्' : 'Return to newsroom sign-in'}
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
