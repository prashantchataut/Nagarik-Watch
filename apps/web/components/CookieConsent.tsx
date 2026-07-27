'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import {
  CONSENT_OPEN_EVENT,
  CONSENT_POLICY_VERSION,
  type ConsentChoice,
  readConsent,
  writeConsent,
} from '@/lib/reader/consent'

export function CookieConsent({ locale }: { locale: Locale }) {
  const dialogRef = useRef<HTMLElement>(null)
  const initialFocusRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [hadChoice, setHadChoice] = useState(false)
  const [personalization, setPersonalization] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [advertising, setAdvertising] = useState(false)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'

  useEffect(() => {
    const choice = readConsent()
    if (!choice) {
      setVisible(true)
      setHadChoice(false)
    } else {
      setHadChoice(true)
      setPersonalization(choice.personalization)
      setAnalytics(choice.analytics)
      setAdvertising(choice.advertising)
    }

    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ mode?: string }>).detail
      const existing = readConsent()
      if (existing) {
        setPersonalization(existing.personalization)
        setAnalytics(existing.analytics)
        setAdvertising(existing.advertising)
        setHadChoice(true)
      }
      setCustomize(detail?.mode !== 'banner')
      setVisible(true)
    }
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!visible) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    initialFocusRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && hadChoice) {
        event.preventDefault()
        setVisible(false)
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => !element.hasAttribute('hidden'))
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [visible, hadChoice])

  function decide(next: Pick<ConsentChoice, 'personalization' | 'analytics' | 'advertising'>) {
    writeConsent({
      essential: true,
      personalization: next.personalization,
      analytics: next.analytics,
      advertising: next.advertising,
      decidedAt: new Date().toISOString(),
      version: CONSENT_POLICY_VERSION,
    })
    setHadChoice(true)
    setVisible(false)
    setCustomize(false)
  }

  function dismissIfAllowed() {
    if (hadChoice) setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 z-40 bg-scrim/70"
        onClick={dismissIfAllowed}
      />
      <section
        ref={dialogRef}
        className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 border-t border-rule bg-surface shadow-overlay sm:inset-x-auto sm:bottom-6 sm:left-6 sm:right-auto sm:w-[min(26rem,calc(100vw-1.5rem))] sm:rounded-lg sm:border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-body"
        lang={lang}
      >
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          <h2
            id="cookie-consent-title"
            className="font-display text-body-lg font-extrabold text-ink sm:text-h3"
          >
            {en ? 'Cookie choices' : 'कुकी छनोट'}
          </h2>
          <span className="mt-1 block h-0.5 w-8 bg-brand" aria-hidden="true" />
          <p id="cookie-consent-body" className="mt-2 text-meta leading-relaxed text-ink-soft">
            {en
              ? 'Essential cookies keep sign-in and language working. Optional cookies help recommendations, visit counts, and house-ad measurement.'
              : 'आवश्यक कुकीले लगइन र भाषा चलाउँछ। वैकल्पिक कुकी सिफारिस, भिजिट गणना र घरको विज्ञापन मापनका लागि हुन्छ।'}{' '}
            <Link
              href={localizeHref(locale, '/cookies')}
              className="font-semibold text-brand-strong underline-offset-2 hover:underline"
            >
              {en ? 'Cookie policy' : 'कुकी नीति'}
            </Link>
          </p>
        </div>

        {customize ? (
          <div className="grid gap-2 border-t border-rule px-4 py-3 sm:px-5">
            <CategoryToggle
              locale={locale}
              titleEn="Personalisation"
              titleNe="व्यक्तिगत"
              descEn="Saved stories, interests, continue reading"
              descNe="सुरक्षित लेख, रुचि, जारी पढाइ"
              checked={personalization}
              onChange={setPersonalization}
            />
            <CategoryToggle
              locale={locale}
              titleEn="Analytics"
              titleNe="एनालिटिक्स"
              descEn="Privacy-friendly visit counts"
              descNe="गोपनीयता-मैत्री भिजिट गणना"
              checked={analytics}
              onChange={setAnalytics}
            />
            <CategoryToggle
              locale={locale}
              titleEn="Advertising measure"
              titleNe="विज्ञापन मापन"
              descEn="House-ad clicks only"
              descNe="घरको विज्ञापन क्लिक मात्र"
              checked={advertising}
              onChange={setAdvertising}
            />
          </div>
        ) : (
          <div className="border-t border-rule px-4 py-3 text-meta text-ink-soft sm:px-5">
            <p>
              <strong className="text-ink">{en ? 'Essential' : 'आवश्यक'}</strong>
              {en ? ' always on.' : ' सधैं सक्रिय।'}
            </p>
            <p className="mt-1">
              <strong className="text-ink">{en ? 'Optional' : 'वैकल्पिक'}</strong>
              {en ? ' off until you choose.' : ' तपाईंले छानेपछि मात्र।'}
            </p>
          </div>
        )}

        <div className="grid gap-2 border-t border-rule px-4 py-3 sm:px-5 sm:py-4">
          {customize ? (
            <>
              <button
                ref={initialFocusRef}
                type="button"
                onClick={() => decide({ personalization, analytics, advertising })}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-brand bg-brand px-4 text-meta font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong active:scale-[0.98]"
              >
                {en ? 'Save choices' : 'छनोट सुरक्षित गर्नुहोस्'}
              </button>
              <button
                type="button"
                onClick={() => setCustomize(false)}
                className="inline-flex min-h-10 w-full items-center justify-center text-meta font-semibold text-ink-soft hover:text-brand-strong"
              >
                {en ? 'Back' : 'पछाडि'}
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  ref={initialFocusRef}
                  type="button"
                  onClick={() => decide({ personalization: false, analytics: false, advertising: false })}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-rule bg-surface px-3 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong active:scale-[0.98]"
                >
                  {en ? 'Essential only' : 'आवश्यक मात्र'}
                </button>
                <button
                  type="button"
                  onClick={() => decide({ personalization: true, analytics: true, advertising: true })}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand bg-brand px-3 text-meta font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong active:scale-[0.98]"
                >
                  {en ? 'Accept optional' : 'वैकल्पिक स्वीकार'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCustomize(true)}
                className="inline-flex min-h-10 w-full items-center justify-center text-meta font-semibold text-brand-strong underline-offset-2 hover:underline"
              >
                {en ? 'Choose each category' : 'वर्ग छान्नुहोस्'}
              </button>
            </>
          )}
        </div>
      </section>
    </>
  )
}

function CategoryToggle({
  locale,
  titleEn,
  titleNe,
  descEn,
  descNe,
  checked,
  onChange,
}: {
  locale: Locale
  titleEn: string
  titleNe: string
  descEn: string
  descNe: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-rule bg-surface-raised px-3 py-2.5 text-meta text-ink-soft transition-colors duration-fast ease-out-quint has-[:checked]:border-brand has-[:checked]:bg-brand-tint/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
      />
      <span>
        <span className="block font-semibold text-ink">
          {locale === 'en' ? titleEn : titleNe}
        </span>
        <span className="mt-0.5 block leading-snug text-caption">
          {locale === 'en' ? descEn : descNe}
        </span>
      </span>
    </label>
  )
}
