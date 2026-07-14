import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { Masthead } from '@/components/Masthead'
import { Footer } from '@/components/Footer'
import { BottomNav } from '@/components/BottomNav'
import { CookieConsent } from '@/components/CookieConsent'
import { PwaBoot } from '@/components/PwaBoot'
import { SiteJsonLd } from '@/components/SiteJsonLd'
import { AnalyticsGate } from '@/components/analytics/AnalyticsGate'
import { getNavCategories } from '@/lib/content'
import { PUBLICATION } from '@/lib/site'
import { getSession } from '@/lib/auth/session'
import { accountKindLabel, resolveAccountKind, roleDisplayLabel } from '@/lib/account-identity'
import { localizeHref } from '@/lib/i18n/locales'

export async function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const english = locale === 'en'
  const [navCategories, session] = await Promise.all([getNavCategories(), getSession()])
  const account = session
    ? {
        displayName: session.displayName || session.email.split('@')[0] || session.email,
        kindLabel: accountKindLabel(resolveAccountKind(session.role), locale),
        roleLabel: roleDisplayLabel(session.role, locale),
        profileHref: localizeHref(locale, '/auth/profile'),
      }
    : null

  return (
    <>
      <a className="skip-link" href="#main">
        {english ? 'Skip to content' : 'मुख्य सामग्रीमा जानुहोस्'}
      </a>
      <SiteJsonLd siteName={PUBLICATION.publisherName} />
      <Masthead locale={locale} navCategories={navCategories} account={account} />
      <main id="main" className="min-h-[55vh] pb-16 lg:pb-0">
        {children}
      </main>
      <Footer locale={locale} />
      <BottomNav locale={locale} />
      <CookieConsent locale={locale} />
      <PwaBoot />
      <AnalyticsGate
        domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
        src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'}
      />
    </>
  )
}

