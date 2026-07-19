import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'

/**
 * Minimal chrome for reader auth routes (no masthead / footer / bottom nav).
 * Login/signup supply their own brand strip via ReaderAuthShell; profile pages
 * use in-page account nav for wayfinding.
 */
export function AuthChrome({ locale, children }: { locale: Locale; children: ReactNode }) {
  const english = locale === 'en'
  return (
    <>
      <a className="skip-link" href="#main">
        {english ? 'Skip to content' : 'मुख्य सामग्रीमा जानुहोस्'}
      </a>
      <div id="main" className="min-h-[70vh]">
        {children}
      </div>
    </>
  )
}
