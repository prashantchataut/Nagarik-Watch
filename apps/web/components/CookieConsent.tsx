'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CONSENT_KEY = 'nw-cookie-consent'

/**
 * Cookie consent banner. Shows once, persists the choice in localStorage.
 * Accept: essential cookies only (the default — we don't run analytics
 * without explicit consent). Decline: same. The banner never blocks
 * content; it's a dismissible strip at the bottom.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const choice = localStorage.getItem(CONSENT_KEY)
    if (!choice) setVisible(true)
  }, [])

  function decide(accepted: boolean) {
    localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-surface-raised/95 backdrop-blur supports-[backdrop-filter]:bg-surface-raised/90 lg:bottom-14" role="dialog" aria-label="Cookie consent">
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
        <p className="text-meta text-ink-soft" lang="ne">
          हामी अनुभव सुधारका लागि आवश्यक कुकीज् प्रयोग गर्छौं।{' '}
          <Link href="/privacy" className="font-semibold text-brand underline-offset-2 hover:underline">विस्तृत</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => decide(false)} className="inline-flex h-9 items-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong" lang="ne">अस्वीकार</button>
          <button onClick={() => decide(true)} className="inline-flex h-9 items-center rounded-full bg-brand px-4 text-meta font-semibold text-surface hover:bg-brand-strong" lang="ne">स्वीकार</button>
        </div>
      </div>
    </div>
  )
}
