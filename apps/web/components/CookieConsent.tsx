'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { type ConsentChoice, readConsent, writeConsent } from '@/lib/reader/consent'

function persist(choice: ConsentChoice) {
  writeConsent(choice)
}

export function CookieConsent({ locale }: { locale: Locale }) {
  const [visible, setVisible] = useState(false)
  const [personalization, setPersonalization] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const lang = locale === 'en' ? 'en' : 'ne'

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
      aria-label={locale === 'en' ? 'Privacy preferences' : 'गोपनीयता रोजाइ'}
      lang={lang}
    >
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
            Reader privacy
          </p>
          <h2 className="mt-1 font-display text-h2 font-extrabold text-ink">
            {locale === 'en' ? 'Your reading, your choice' : 'तपाईंको पढाइ, तपाईंको रोजाइ'}
          </h2>
          <p className="mt-2 max-w-2xl text-body leading-relaxed text-ink-soft">
            {locale === 'en'
              ? 'Essential storage keeps the site working. Personalisation saves reading history, saved stories and interests in this browser. Analytics runs only after permission.'
              : 'आवश्यक भण्डारणले साइट चलाउँछ। व्यक्तिगत सिफारिस खोल्दा पढाइ इतिहास, सुरक्षित लेख र रुचि यही ब्राउजरमा राखिन्छ। Analytics अनुमति दिएपछि मात्र चल्छ।'}{' '}
            <Link href={localizeHref(locale, '/privacy')} className="font-semibold text-brand underline-offset-2 hover:underline">
              {locale === 'en' ? 'Privacy policy' : 'गोपनीयता नीति'}
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
              <span>
                {locale === 'en'
                  ? 'Personal recommendations, reading history and continue-reading modules.'
                  : 'व्यक्तिगत सिफारिस, पढाइ इतिहास र जारी राख्नुहोस् मोड्युल।'}
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-rule bg-surface px-3 py-3 text-meta text-ink-soft">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.currentTarget.checked)}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span>
                {locale === 'en'
                  ? 'Privacy-friendly analytics to understand which coverage is useful.'
                  : 'कुन सामग्री उपयोगी छ बुझ्न गोपनीयता-मैत्री analytics।'}
              </span>
            </label>
          </div>
          <p className="mt-2 text-[0.72rem] text-mute">
            {locale === 'en' ? 'You can change this later from the privacy page.' : 'पछि गोपनीयता पृष्ठबाट यो रोजाइ बदल्न सकिन्छ।'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button
            type="button"
            onClick={() => decide({ personalization: false, analytics: false })}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
          >
            {locale === 'en' ? 'Essential only' : 'आवश्यक मात्र'}
          </button>
          <button
            type="button"
            onClick={acceptPersonalDesk}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-4 text-meta font-semibold text-surface transition-colors hover:bg-brand-strong"
          >
            {locale === 'en' ? 'Enable personalisation' : 'व्यक्तिगत डेस्क खोल्नुहोस्'}
          </button>
          <button
            type="button"
            onClick={() => decide({ personalization, analytics })}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-4 text-meta font-semibold text-ink transition-colors hover:bg-brand-tint hover:text-brand-strong"
          >
            {locale === 'en' ? 'Save choices' : 'रोजाइ सुरक्षित गर्नुहोस्'}
          </button>
        </div>
      </div>
    </section>
  )
}
