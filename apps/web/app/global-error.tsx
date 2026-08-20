'use client'

import { useEffect } from 'react'
import './globals.css'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    void import('@/lib/observability/sentry').then(({ captureException }) => {
      captureException(error, { surface: 'global-error', digest: error.digest })
    })
  }, [error])

  return (
    <html lang="ne">
      <body className="bg-surface text-ink antialiased">
        <main className="mx-auto min-h-screen max-w-page px-4 py-12 sm:py-16" role="alert">
          <div className="max-w-3xl border-y border-rule py-10">
            <p className="text-caption font-bold text-brand-strong" lang="ne">
              पृष्ठ लोड हुन सकेन
            </p>
            <h1 className="mt-2 font-display text-display text-ink" lang="ne">
              केही गडबड भयो
            </h1>
            <p className="mt-1 font-display text-h2 text-ink-soft" lang="en">
              This page could not load
            </p>
            <div className="mt-4 max-w-body space-y-1 text-body-lg leading-relaxed text-ink-soft">
              <p lang="ne">फेरि प्रयास गर्नुहोस् वा गृहपृष्ठमा फर्कनुहोस्।</p>
              <p lang="en">Try again, or return to the homepage.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('nw-chunk-reload')
                  } catch {
                    // Session storage is optional in restricted browser contexts.
                  }
                  window.location.reload()
                }}
                className="min-h-13 border border-brand bg-brand px-6 text-meta font-bold text-paper hover:bg-brand-strong"
                lang="ne"
              >
                पृष्ठ रिफ्रेश गर्नुहोस्
              </button>
              <button
                type="button"
                onClick={reset}
                className="min-h-13 border border-rule px-6 text-meta font-bold text-ink hover:border-brand hover:text-brand-strong"
                lang="en"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex min-h-13 items-center border border-rule px-6 text-meta font-bold text-ink hover:border-brand hover:text-brand-strong"
                lang="ne"
              >
                गृहपृष्ठ
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
