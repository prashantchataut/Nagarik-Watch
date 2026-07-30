import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
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
 * Shared Operate shell for admin and journalist sign-in.
 * Compact desk entrance: brand mast, brief, form. Not a marketing hero.
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
  const badge = kind === 'admin' ? (ne ? 'सम्पादकीय' : 'Editorial') : ne ? 'पत्रकार' : 'Reporter'

  return (
    <main
      className={`newsroom-login ${kind === 'admin' ? 'newsroom-login--admin' : 'newsroom-login--reporter'}`}
      lang={ne ? 'ne' : 'en'}
    >
      <div className="newsroom-login__mast">
        <Link href={homeHref} aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}>
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
        </Link>
        <span className="newsroom-login__badge">{badge}</span>
      </div>

      <nav className="newsroom-login__switch" aria-label={ne ? 'लगइन प्रकार' : 'Sign-in type'}>
        <Link
          href="/admin/login"
          className={kind === 'admin' ? 'is-active' : undefined}
          aria-current={kind === 'admin' ? 'page' : undefined}
        >
          {ne ? 'एडमिन' : 'Admin'}
        </Link>
        <Link
          href={localizeHref(locale, '/journalist/login')}
          className={kind === 'journalist' ? 'is-active' : undefined}
          aria-current={kind === 'journalist' ? 'page' : undefined}
        >
          {ne ? 'पत्रकार' : 'Reporter'}
        </Link>
        <Link href={localizeHref(locale, '/auth/login')}>{ne ? 'पाठक' : 'Reader'}</Link>
      </nav>

      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <h1>{title}</h1>
          <p>{lede}</p>
          {points.length > 0 ? (
            <ul className="newsroom-login__points">
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="newsroom-login__form">
          <header>
            <h2>{formTitle}</h2>
            <p>{formLede}</p>
          </header>
          {children}
          <footer>{footer}</footer>
        </section>
      </div>
    </main>
  )
}
