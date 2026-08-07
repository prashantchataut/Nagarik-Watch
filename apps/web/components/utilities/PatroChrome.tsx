import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { HtmlLangSync } from '@/components/HtmlLangSync'
import { PatroShell } from '@/components/utilities/PatroShell'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { SiteJsonLd } from '@/components/SiteJsonLd'
import { PUBLICATION } from '@/lib/site'
import { SaveDataBoot } from '@/components/SaveDataBoot'

/**
 * Calendar-host layout: utility chrome only — no news masthead, ticker, or bottom nav.
 */
export function PatroChrome({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale)
  return (
    <>
      <HtmlLangSync locale={locale} />
      <a className="skip-link" href="#main">
        {dict.skipToContent}
      </a>
      <SiteJsonLd siteName={`${PUBLICATION.publisherName} Patro`} />
      <SaveDataBoot />
      <PatroShell locale={locale} mode="standalone">
        {children}
      </PatroShell>
    </>
  )
}
