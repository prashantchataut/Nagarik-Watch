'use client'

import type { Locale } from '@nagarikwatch/db'
import { openCookiePreferences } from '@/lib/reader/consent'

export function ManageCookiesButton({ locale }: { locale: Locale }) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences('customize')}
      className="inline-flex min-h-11 items-center rounded-md border border-brand bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
      lang={locale === 'en' ? 'en' : 'ne'}
    >
      {locale === 'en' ? 'Manage cookies' : 'कुकी व्यवस्थापन'}
    </button>
  )
}
