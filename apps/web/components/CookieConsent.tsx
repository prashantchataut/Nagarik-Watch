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
  const [customize, setCustomize] = useState(false)
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

  if (!visible) return null

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-surface shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
      role="dialog"
      aria-label={locale === 'en' ? 'Cookie settings' : 'कुकी सेटिङ'}
      lang={lang}
    >
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-4 lg:flex-row lg:items-end lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong">
            {locale === 'en' ? 'Cookies' : 'कुकी'}
          </p>
          <p className="mt-1 text-body leading-relaxed text-ink-soft">
            {locale === 'en'
              ? 'We use essential storage to run the site. Optional cookies cover personalisation and analytics — only if you allow them.'
              : 'साइट चलाउन आवश्यक भण्डारण प्रयोग हुन्छ। व्यक्तिगत सिफारिस र एनालिटिक्सका लागि वैकल्पिक कुकी — तपाईं अनुमति दिएपछि मात्र।'}{' '}
            <Link
              href={localizeHref(locale, '/cookies')}
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              {locale === 'en' ? 'Cookie policy' : 'कुकी नीति'}
            </Link>
          </p>

          {customize ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="flex items-start gap-2 border border-rule bg-surface-raised px-3 py-2.5 text-meta text-ink-soft">
                <input
                  type="checkbox"
                  checked={personalization}
                  onChange={(event) => setPersonalization(event.currentTarget.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span>
                  {locale === 'en'
                    ? 'Personalisation — saved stories, interests, continue reading'
                    : 'व्यक्तिगत — सुरक्षित लेख, रुचि, जारी राख्नुहोस्'}
                </span>
              </label>
              <label className="flex items-start gap-2 border border-rule bg-surface-raised px-3 py-2.5 text-meta text-ink-soft">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.currentTarget.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand"
                />
                <span>
                  {locale === 'en'
                    ? 'Analytics — privacy-friendly page counts (no ads tracking)'
                    : 'एनालिटिक्स — गोपनीयता-मैत्री भिजिट गणना (विज्ञापन ट्र्याकिङ छैन)'}
                </span>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide({ personalization: false, analytics: false })}
            className="inline-flex min-h-11 items-center justify-center border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
          >
            {locale === 'en' ? 'Essential only' : 'आवश्यक मात्र'}
          </button>
          {customize ? (
            <button
              type="button"
              onClick={() => decide({ personalization, analytics })}
              className="inline-flex min-h-11 items-center justify-center border border-brand bg-brand px-4 text-meta font-semibold text-surface hover:bg-brand-strong"
            >
              {locale === 'en' ? 'Save choices' : 'रोजाइ सुरक्षित'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCustomize(true)}
                className="inline-flex min-h-11 items-center justify-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
              >
                {locale === 'en' ? 'Customise' : 'अनुकूलन'}
              </button>
              <button
                type="button"
                onClick={() => decide({ personalization: true, analytics: true })}
                className="inline-flex min-h-11 items-center justify-center border border-brand bg-brand px-4 text-meta font-semibold text-surface hover:bg-brand-strong"
              >
                {locale === 'en' ? 'Accept all' : 'सबै स्वीकार'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
