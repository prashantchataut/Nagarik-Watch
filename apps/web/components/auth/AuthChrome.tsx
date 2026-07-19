import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { Logo } from '@/components/Logo'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

/** Minimal sticky bar for reader auth and account routes. */
export function AuthChrome({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale)
  const english = locale === 'en'
  return (
    <div className="auth-chrome" lang={english ? 'en' : 'ne'}>
      <a className="skip-link" href="#main">
        {english ? 'Skip to content' : 'मुख्य सामग्रीमा जानुहोस्'}
      </a>
      <header className="auth-chrome__bar">
        <Link
          href={localizeHref(locale, '/')}
          className="auth-chrome__logo"
          aria-label={dict.siteName}
        >
          <Logo siteName={dict.siteName} className="max-w-[9.5rem]" />
        </Link>
        <Link href={localizeHref(locale, '/')} className="auth-chrome__back">
          {english ? 'Back to news' : 'समाचारमा'}
        </Link>
      </header>
      <div id="main" className="auth-chrome__main">
        {children}
      </div>
    </div>
  )
}
