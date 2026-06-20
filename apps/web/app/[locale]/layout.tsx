import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import '@nagarikwatch/ui/tokens.css'
import { fontVariables } from '../fonts'
import { asLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getNavCategories } from '@/lib/content'
import { Masthead } from '@/components/Masthead'
import { Footer } from '@/components/Footer'

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
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: {
      default: `${dict.siteName} — ${dict.tagline}`,
      template: `%s — ${dict.siteName}`,
    },
    description: dict.metaDescription,
    openGraph: { type: 'website', siteName: dict.siteName, locale: locale === 'ne' ? 'ne_NP' : 'en_US' },
    twitter: { card: 'summary_large_image' },
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
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const navCategories = await getNavCategories()

  // Plausible (privacy-friendly, cookieless). Only emitted when a domain is configured, so
  // dev and previews stay analytics-free and the script never loads without an explicit opt-in.
  // NEXT_PUBLIC_PLAUSIBLE_SRC allows pointing at a self-hosted endpoint instead of plausible.io.
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.js'

  return (
    <html lang={locale} dir="ltr" className={fontVariables} data-theme="light" suppressHydrationWarning>
      <head>
        {plausibleDomain && (
          <script
            defer
            data-domain={plausibleDomain}
            src={plausibleSrc}
          />
        )}
      </head>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-2 focus:shadow-overlay"
        >
          {getDictionary(locale).skipToContent}
        </a>
        <Masthead locale={locale} navCategories={navCategories} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
      </body>
    </html>
  )
}
