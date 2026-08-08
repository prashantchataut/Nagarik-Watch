'use client'

import { useEffect } from 'react'
import type { Locale } from '@nagarikwatch/db'

/** Keep <html lang> honest across client navigations; root layout may not remount. */
export function HtmlLangSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale
    }
  }, [locale])
  return null
}
