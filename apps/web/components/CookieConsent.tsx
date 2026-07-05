'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'nw-cookie-consent-v2'

type ConsentChoice = {
  essential: true
  analytics: boolean
  decidedAt: string
}

function persist(choice: ConsentChoice) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(choice))
  window.dispatchEvent(new Event('nw-cookie-consent-change'))
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    const choice = localStorage.getItem(CONSENT_KEY)
    if (!choice) setVisible(true)
  }, [])

  function decide(nextAnalytics: boolean) {
    persist({ essential: true, analytics: nextAnalytics, decidedAt: new Date().toISOString() })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-surface-raised/95 shadow-overlay backdrop-blur supports-[backdrop-filter]:bg-surface-raised/90 lg:bottom-14"
      role="dialog"
      aria-label="Cookie preferences"
    >
      <div className="mx-auto grid max-w-page gap-4 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-meta font-bold uppercase tracking-[0.16em] text-brand-strong" lang="en">
            Privacy choice
          </p>
          <p className="mt-1 max-w-3xl text-body text-ink-soft" lang="ne">
            साइट चलाउन आवश्यक कुकी प्रयोग हुन्छ। पढाइ सुधार्न गोपनीयता-मैत्री analytics चाहिन्छ भने मात्र खोल्नुहोस्।
            {' '}<Link href="/privacy" className="font-semibold text-brand underline-offset-2 hover:underline">गोपनीयता नीति</Link>
          </p>
          <label className="mt-3 flex max-w-xl items-start gap-3 rounded-md border border-rule bg-surface px-3 py-2 text-meta text-ink-soft">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(event) => setAnalytics(event.currentTarget.checked)}
              className="mt-1 h-4 w-4 accent-brand"
            />
            <span lang="ne">
              Analytics अनुमति दिन्छु, कुन पृष्ठ उपयोगी छ भनेर समग्र रूपमा बुझ्न। विज्ञापन ट्र्याकिङ होइन।
            </span>
          </label>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            onClick={() => decide(false)}
            className="inline-flex h-10 items-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            आवश्यक मात्र
          </button>
          <button
            onClick={() => decide(analytics)}
            className="inline-flex h-10 items-center rounded-full bg-brand px-4 text-meta font-semibold text-surface hover:bg-brand-strong"
            lang="ne"
          >
            रोजाइ सुरक्षित गर्नुहोस्
          </button>
        </div>
      </div>
    </div>
  )
}
