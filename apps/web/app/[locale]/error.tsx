'use client'

import { useEffect } from 'react'
import { getDictionary } from '@/lib/i18n/dictionaries'

/**
 * Client error boundary for the locale route group. Surfaces a calm, bilingual message and a
 * recovery action (reset). The error is logged for diagnostics but never rendered raw to the
 * reader. Nepali is primary per the i18n rule; English sits beneath it.
 *
 * Error boundaries receive no params and run on the client, so the locale cannot be read from
 * the segment here. Both locales are shown, mirroring not-found.tsx, so a reader who hits a
 * runtime error sees a clear recovery path in whichever language they read.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const ne = getDictionary('ne')
  const en = getDictionary('en')

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-body flex-col items-center px-4 py-20 text-center"
    >
      <h1 className="font-display text-h1 text-ink" lang="ne">
        {ne.errorHeading}
      </h1>
      <p className="mt-3 text-body-lg text-ink-soft" lang="ne">
        {ne.errorBody}
      </p>
      <p className="mt-1 text-body text-ink-soft" lang="en">
        {en.errorBody}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-meta font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong"
      >
        <span lang="ne">{ne.errorRetry}</span>
        <span aria-hidden="true" className="mx-1.5">
          /
        </span>
        <span lang="en">{en.errorRetry}</span>
      </button>
    </div>
  )
}
