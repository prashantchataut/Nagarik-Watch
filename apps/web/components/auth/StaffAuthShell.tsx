import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { AuthIllustration } from '@/components/auth/AuthIllustration'
import { localizeHref } from '@/lib/i18n/locales'

export type StaffLoginKind = 'admin' | 'journalist'

type StaffAuthShellProps = {
  kind: StaffLoginKind
  locale?: 'ne' | 'en'
  title: string
  lede: string
  formTitle: string
  formLede: string
  points: string[]
  footer: ReactNode
  children: ReactNode
}

/**
 * Shared staff entrance. Reporter and admin retain the same information
 * architecture but use different visual weight: reporter is welcoming and work-focused,
 * admin is more restrained and security-forward.
 */
export function StaffAuthShell({
  kind,
  locale = 'ne',
  title,
  lede,
  formTitle,
  formLede,
  points,
  footer,
  children,
}: StaffAuthShellProps) {
  const ne = locale === 'ne'
  const homeHref = kind === 'admin' ? '/' : localizeHref(locale, '/')
  const badge = kind === 'admin' ? (ne ? 'सम्पादकीय प्रशासन' : 'Editorial administration') : ne ? 'पत्रकार डेस्क' : 'Reporter desk'
  const illustration = kind === 'admin' ? 'admin' : 'journalist'

  return (
    <main className={`newsroom-login newsroom-login--${kind}`} lang={ne ? 'ne' : 'en'}>
      <div className="newsroom-login__frame">
        <aside className="newsroom-login__visual">
          <div className="newsroom-login__visual-top">
            <Link href={homeHref} aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}>
              <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} tone={kind === 'admin' ? 'onDark' : 'default'} />
            </Link>
            <span className="newsroom-login__badge">{badge}</span>
          </div>

          <div className="newsroom-login__brief">
            <p className="newsroom-login__kicker">{kind === 'admin' ? (ne ? 'सुरक्षित न्युजरुम पहुँच' : 'Secure newsroom access') : ne ? 'रिपोर्टिङ कार्यक्षेत्र' : 'Reporting workspace'}</p>
            <h1>{title}</h1>
            <p>{lede}</p>
            {points.length > 0 ? (
              <ul className="newsroom-login__points">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <AuthIllustration variant={illustration} className="newsroom-login__illustration" />
        </aside>

        <section className="newsroom-login__form" aria-labelledby="staff-auth-title">
          <nav className="newsroom-login__switch" aria-label={ne ? 'लगइन प्रकार' : 'Sign-in type'}>
            <Link href={localizeHref(locale, '/journalist/login')} className={kind === 'journalist' ? 'is-active' : undefined} aria-current={kind === 'journalist' ? 'page' : undefined}>
              {ne ? 'पत्रकार' : 'Reporter'}
            </Link>
            <Link href={localizeHref(locale, '/auth/login')}>{ne ? 'पाठक' : 'Reader'}</Link>
          </nav>

          <div className="newsroom-login__form-main">
            <header>
              <p className="newsroom-login__form-kicker">{kind === 'admin' ? (ne ? 'न्युजरुम नियन्त्रण' : 'Newsroom control') : ne ? 'आफ्नो डेस्क खोल्नुहोस्' : 'Open your desk'}</p>
              <h2 id="staff-auth-title">{formTitle}</h2>
              <p>{formLede}</p>
            </header>
            {children}
          </div>

          <footer>{footer}</footer>
        </section>
      </div>
    </main>
  )
}
