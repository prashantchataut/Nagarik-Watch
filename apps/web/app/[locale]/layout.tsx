import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import '../globals.css'
import { fontVariables } from '../fonts'
import { asLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getNavCategories } from '@/lib/content'
import { Masthead } from '@/components/Masthead'
import { Footer } from '@/components/Footer'
import { SiteJsonLd } from '@/components/SiteJsonLd'
import { UtilityStrip } from '@/components/live/UtilityStrip'
import { BottomNav } from '@/components/BottomNav'
import { MobileAdDock } from '@/components/MobileAdDock'
import { CookieConsent } from '@/components/CookieConsent'

import { PwaBoot } from '@/components/PwaBoot'
import { AnalyticsGate } from '@/components/analytics/AnalyticsGate'
import { SITE_URL } from '@/lib/site'

export const dynamicParams = false

export function generateStaticParams() {
  return [{ locale: 'ne' }, { locale: 'en' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${dict.siteName} — ${dict.tagline}`,
      template: `%s — ${dict.siteName}`,
    },
    description: dict.metaDescription,
    openGraph: {
      type: 'website',
      siteName: dict.siteName,
      locale: locale === 'ne' ? 'ne_NP' : 'en_US',
    },
    twitter: { card: 'summary_large_image' },
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical: '/',
      languages: { ne: '/', en: '/en' },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const navCategories = await getNavCategories()

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.js'

  return (
    <html lang={locale} dir="ltr" className={fontVariables} suppressHydrationWarning>
      <head>
        <SiteJsonLd siteName={getDictionary(locale).siteName} />
        <script
          // Resolve the initial theme before paint so locale navigation never flips the colour scheme.
          // Only an explicit reader choice stored in nw-theme can set dark mode; otherwise the site
          // starts in light mode. This avoids the reported bug where changing English/Nepali
          // appeared to inherit the OS dark preference and unexpectedly changed the site theme.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('nw-theme');var t=s==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-2 focus:shadow-overlay"
        >
          {getDictionary(locale).skipToContent}
        </a>
        <Masthead locale={locale} navCategories={navCategories} />

        <UtilityStrip locale={locale} />
        <main id="main" className="safe-bottom lg:pb-0">
          {children}
        </main>
        <Footer locale={locale} />
        <MobileAdDock locale={locale} />
        <BottomNav locale={locale} />
        <AnalyticsGate domain={plausibleDomain} src={plausibleSrc} />
        <PwaBoot />
        <CookieConsent locale={locale} />
      </body>
    </html>
  )
}
