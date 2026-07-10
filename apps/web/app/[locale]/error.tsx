'use client'

import { useEffect } from 'react'

export default function PublicRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[public-route]', error.digest ?? error.message)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center" role="alert">
      <h1 className="font-display text-h1 text-ink">पृष्ठ खोल्न सकिएन / Page unavailable</h1>
      <p className="mt-3 text-body text-ink-soft">कृपया केहीबेरपछि पुनः प्रयास गर्नुहोस्। Please try again shortly.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-full bg-brand px-5 py-3 font-semibold text-surface">पुनः प्रयास / Retry</button>
      {error.digest ? <p className="mt-4 text-caption text-mute">Reference: {error.digest}</p> : null}
    </main>
  )
}
