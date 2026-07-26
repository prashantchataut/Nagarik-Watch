'use client'

import { useEffect } from 'react'
import { AdminButton } from '@/components/admin/primitives'

export default function AdminRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[admin-route]', error.digest ?? error.message)
  }, [error])

  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center" role="alert">
      <h1 className="font-display text-h1 text-ink">न्यूजरुम पृष्ठ खोल्न सकिएन</h1>
      <p className="mt-3 text-body text-ink-soft">सर्भर वा डाटाबेस जडान जाँचेर फेरि प्रयास गर्नुहोस्।</p>
      <AdminButton type="button" onClick={reset} className="mt-6">पुनः प्रयास गर्नुहोस्</AdminButton>
      {error.digest ? <p className="mt-4 text-caption text-mute">Reference: {error.digest}</p> : null}
    </main>
  )
}
