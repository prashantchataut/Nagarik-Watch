'use client'

import type { Locale } from '@nagarikwatch/db'
import { openCookiePreferences } from '@/lib/reader/consent'

export function ManageCookiesButton({ locale }: { locale: Locale }) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences('customize')}
      className="inline-flex min-h-9 items-center rounded border border-chrome-rule px-3 text-caption font-bold text-on-chrome-soft transition-colors hover:border-brand hover:text-on-chrome"
      lang={locale === 'en' ? 'en' : 'ne'}
    >
      {locale === 'en' ? 'Manage cookies' : 'कुकी व्यवस्थापन'}
    </button>
  )
}
