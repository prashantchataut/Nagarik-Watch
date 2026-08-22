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
    <main className="mx-auto max-w-3xl py-8 sm:py-12" role="alert" lang="ne">
      <div className="grid gap-5 border-y border-rule py-6 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-8 sm:py-8">
        <p className="font-sans text-5xl font-black tabular-nums text-brand-strong" aria-hidden="true">
          ERR
        </p>
        <div>
          <p className="text-caption font-extrabold text-brand-strong">न्युजरुम</p>
          <h1 className="mt-1.5 font-display text-[clamp(1.9rem,4vw,3rem)] font-black leading-tight text-ink">
            यो कार्यक्षेत्र खोल्न सकिएन
          </h1>
          <p className="mt-2 max-w-[55ch] text-meta leading-relaxed text-ink-soft">
            सर्भर वा डाटाबेस जडान अस्थायी रूपमा उपलब्ध नहुन सक्छ। पुनः प्रयास गर्नुहोस्; समस्या रहे ड्यासबोर्डबाट अर्को काम खोल्नुहोस्।
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <AdminButton type="button" onClick={reset}>
              पुनः प्रयास
            </AdminButton>
            <AdminButton href="/admin/dashboard" variant="secondary">
              ड्यासबोर्ड
            </AdminButton>
            <AdminButton href="/admin/articles" variant="ghost">
              समाचार
            </AdminButton>
          </div>
          {error.digest ? (
            <p className="mt-4 text-caption text-mute" lang="en">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}
