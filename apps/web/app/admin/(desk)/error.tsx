'use client'

import { useEffect } from 'react'
import { AdminButton } from '@/components/admin/primitives'

export default function AdminRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[admin-route]', error.digest ?? error.message)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center" role="alert">
      <h1 className="font-display text-h1 text-ink" lang="ne">
        न्यूजरुम पृष्ठ खोल्न सकिएन
      </h1>
      <p className="mt-3 text-body text-ink-soft" lang="ne">
        सर्भर वा डाटाबेस जडान जाँचेर फेरि प्रयास गर्नुहोस्। समाचार सूची अझै काम गर्न सक्छ।
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <AdminButton type="button" onClick={reset}>
          पुनः प्रयास गर्नुहोस्
        </AdminButton>
        <AdminButton href="/admin/dashboard" variant="secondary">
          ड्यासबोर्ड
        </AdminButton>
        <AdminButton href="/admin/articles" variant="ghost">
          समाचार सूची
        </AdminButton>
        <AdminButton href="/admin/login" variant="ghost">
          लगइन
        </AdminButton>
      </div>
      {error.digest ? (
        <p className="mt-4 text-caption text-mute" lang="en">
          Reference: {error.digest}
        </p>
      ) : null}
    </main>
  )
}
