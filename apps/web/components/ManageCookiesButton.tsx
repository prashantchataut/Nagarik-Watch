'use client'

import type { Locale } from '@nagarikwatch/db'
import { openCookiePreferences } from '@/lib/reader/consent'

export function ManageCookiesButton({ locale }: { locale: Locale }) {
  return (
    <button
      type="button"
      onClick={() => openCookiePreferences('customize')}
      className="text-left text-meta text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline"
      lang={locale === 'en' ? 'en' : 'ne'}
    >
      {locale === 'en' ? 'Manage cookies' : 'कुकी व्यवस्थापन'}
    </button>
  )
}
