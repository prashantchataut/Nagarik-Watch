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

export async function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const english = locale === 'en'
  const navCategories = await getNavCategories()

  return (
    <>
      <a className="skip-link" href="#main">
        {english ? 'Skip to content' : 'मुख्य सामग्रीमा जानुहोस्'}
      </a>
      <SiteJsonLd siteName={PUBLICATION.publisherName} />
      <Masthead locale={locale} navCategories={navCategories} />
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
