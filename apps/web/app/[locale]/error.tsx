'use client'

import { useEffect } from 'react'

/**
 * Client error boundary for the locale route group. Surfaces a calm, bilingual message and a
 * recovery action (reset). The error is logged for diagnostics but never rendered raw to the
 * reader. Nepali is primary per the i18n rule; English sits beneath it.
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

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-body flex-col items-center px-4 py-20 text-center"
    >
      <h1 className="font-display text-h1 text-ink" lang="ne">
        केही गडबड भयो
      </h1>
      <p className="mt-3 text-body-lg text-ink-soft" lang="ne">
        पृष्ठ लोड गर्दा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।
      </p>
      <p className="mt-1 text-body text-mute" lang="en">
        Something went wrong loading this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-sm bg-brand px-5 py-2.5 text-meta font-bold text-surface transition-[transform] duration-fast ease-out-quint hover:scale-[1.02]"
      >
        पुनः प्रयास गर्नुहोस् / Try again
      </button>
    </div>
  )
}
