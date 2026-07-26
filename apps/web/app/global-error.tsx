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
            <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong" lang="en">
              Service unavailable
            </p>
            <h1 className="mt-2 font-display text-display text-ink" lang="ne">
              सेवा अस्थायी रूपमा उपलब्ध छैन
            </h1>
            <p className="mt-1 font-display text-h2 text-ink-soft" lang="en">
              Service temporarily unavailable
            </p>
            <div className="mt-4 max-w-body space-y-1 text-body-lg leading-relaxed text-ink-soft">
              <p lang="ne">कृपया केहीबेरपछि पुनः प्रयास गर्नुहोस्। समस्या जारी रहे समाचार कक्षसँग सम्पर्क गर्नुहोस्।</p>
              <p lang="en">Please try again shortly. If the problem continues, contact the newsroom administrator.</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('nw-chunk-reload')
                  } catch {
                    /* ignore */
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
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
