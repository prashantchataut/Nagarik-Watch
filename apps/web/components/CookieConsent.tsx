'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { type ConsentChoice, readConsent, writeConsent } from '@/lib/reader/consent'

function persist(choice: ConsentChoice) {
  writeConsent(choice)
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [personalization, setPersonalization] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    const choice = readConsent()
    if (!choice) setVisible(true)
    else {
      setPersonalization(choice.personalization)
      setAnalytics(choice.analytics)
    }
  }, [])

  function decide(next: { personalization: boolean; analytics: boolean }) {
    persist({
      essential: true,
      personalization: next.personalization,
      analytics: next.analytics,
      decidedAt: new Date().toISOString(),
    })
    setVisible(false)
  }

  function acceptPersonalDesk() {
    decide({ personalization: true, analytics })
  }

  if (!visible) return null

  return (
    <section
      className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-[54rem] rounded-2xl border border-rule bg-surface-raised shadow-overlay lg:bottom-5"
      role="dialog"
      aria-label="Cookie preferences"
    >
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
            Reader privacy desk
          </p>
          <h2 className="mt-1 font-display text-h2 font-extrabold text-ink" lang="ne">
            तपाईंको पढाइ, तपाईंको रोजाइ
          </h2>
          <p className="mt-2 max-w-2xl text-body leading-relaxed text-ink-soft" lang="ne">
            आवश्यक कुकीले साइट चलाउँछ। व्यक्तिगत सिफारिस खोल्दा हालै पढिएको, सुरक्षित लेख र रुचि यही ब्राउजरमा राखिन्छ। Analytics छुट्टै अनुमति बिना चल्दैन।{' '}
            <Link href="/privacy" className="font-semibold text-brand underline-offset-2 hover:underline">
              गोपनीयता नीति
            </Link>
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-lg border border-rule bg-surface px-3 py-3 text-meta text-ink-soft">
              <input
                type="checkbox"
                checked={personalization}
                onChange={(event) => setPersonalization(event.currentTarget.checked)}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span lang="ne">
                व्यक्तिगत सिफारिस, पढाइ इतिहास र जारी राख्नुहोस् मोड्युल।
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-rule bg-surface px-3 py-3 text-meta text-ink-soft">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.currentTarget.checked)}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span lang="ne">
                गोपनीयता-मैत्री analytics, कुन सामग्री उपयोगी छ बुझ्न।
              </span>
            </label>
          </div>
          <p className="mt-2 text-[0.72rem] text-mute" lang="ne">
            पछि गोपनीयता पृष्ठबाट यो रोजाइ बदल्न सकिन्छ।
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={() => decide({ personalization: false, analytics: false })}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            आवश्यक मात्र
          </button>
          <button
            type="button"
            onClick={acceptPersonalDesk}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-4 text-meta font-semibold text-surface transition-colors hover:bg-brand-strong"
            lang="ne"
          >
            व्यक्तिगत डेस्क खोल्नुहोस्
          </button>
          <button
            type="button"
            onClick={() => decide({ personalization, analytics })}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-4 text-meta font-semibold text-ink transition-colors hover:bg-brand-tint hover:text-brand-strong"
            lang="ne"
          >
            रोजाइ सुरक्षित गर्नुहोस्
          </button>
        </div>
      </div>
    </section>
  )
}
