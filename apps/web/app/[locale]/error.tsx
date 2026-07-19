'use client'

import { useEffect } from 'react'
import { getDictionary } from '@/lib/i18n/dictionaries'

export default function PublicRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const ne = getDictionary('ne')
  const en = getDictionary('en')

  useEffect(() => {
    console.error('[public-route]', error.digest ?? error.message)
    void import('@/lib/observability/sentry').then(({ captureException }) => {
      captureException(error, { surface: 'public-route', digest: error.digest })
    })
  }, [error])

  return (
    <main className="mx-auto min-h-[55vh] max-w-page px-4 py-12 sm:py-16" role="alert">
      <div className="max-w-3xl border-y border-rule py-10">
        <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong" lang="en">
          Page unavailable
        </p>
        <h1 className="mt-2 font-display text-display text-ink" lang="ne">
          {ne.errorHeading}
        </h1>
        <p className="mt-1 font-display text-h2 text-ink-soft" lang="en">
          {en.errorHeading}
        </p>
        <div className="mt-4 max-w-body space-y-1 text-body-lg leading-relaxed text-ink-soft">
          <p lang="ne">{ne.errorBody}</p>
          <p lang="en">{en.errorBody}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-13 border border-brand bg-brand px-6 text-meta font-bold text-surface hover:bg-brand-strong"
            lang="ne"
          >
            {ne.errorRetry}
          </button>
          <button
            type="button"
            onClick={reset}
            className="min-h-13 border border-rule px-6 text-meta font-bold text-ink hover:border-brand hover:text-brand-strong"
            lang="en"
          >
            {en.errorRetry}
          </button>
        </div>
        {error.digest ? (
          <p className="mt-6 text-caption text-mute" lang="en">
            Reference: {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  )
}
