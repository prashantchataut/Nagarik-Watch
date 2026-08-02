import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { Logo } from '@/components/Logo'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

/** Sticky chrome bar for reader auth — matches public masthead brand band. */
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
          <Logo siteName={dict.siteName} tone="chrome" className="max-w-[11rem] sm:max-w-[13rem]" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={localizeHref(locale, '/auth/login')}
            className="auth-chrome__back hidden sm:inline-flex"
          >
            {english ? 'Sign in' : 'लगइन'}
          </Link>
          <Link href={localizeHref(locale, '/')} className="auth-chrome__back">
            {english ? 'Back to news' : 'समाचारमा'}
          </Link>
        </div>
      </header>
      <div id="main" className="auth-chrome__main">
        {children}
      </div>
    </div>
  )
}
