'use client'

import type { Locale } from '@nagarikwatch/db'

export function PrintButton({ locale, className }: { locale: Locale; className?: string }) {
  const en = locale === 'en'
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 cursor-pointer items-center border-b-2 border-transparent px-1 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong ${className ?? ''}`}
      onClick={() => window.print()}
    >
      {en ? 'Print' : 'प्रिन्ट'}
    </button>
  )
}
