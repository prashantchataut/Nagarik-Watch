'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import {
  CONSENT_OPEN_EVENT,
  type ConsentChoice,
  readConsent,
  writeConsent,
} from '@/lib/reader/consent'

export function CookieConsent({ locale }: { locale: Locale }) {
  const dialogRef = useRef<HTMLElement>(null)
  const initialFocusRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [personalization, setPersonalization] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [advertising, setAdvertising] = useState(false)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'

  useEffect(() => {
    const choice = readConsent()
    if (!choice) setVisible(true)
    else {
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
      if (event.key === 'Escape') {
        event.preventDefault()
        // Dismiss without writing: reader must still choose on next visit.
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
  }, [visible])

  function decide(next: Pick<ConsentChoice, 'personalization' | 'analytics' | 'advertising'>) {
    writeConsent({
      essential: true,
      personalization: next.personalization,
      analytics: next.analytics,
      advertising: next.advertising,
      decidedAt: new Date().toISOString(),
      version: 4,
    })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 z-40 bg-ink/25 motion-safe:transition-opacity motion-safe:duration-base motion-safe:ease-out-quint"
        onClick={() => setVisible(false)}
      />
      <section
        ref={dialogRef}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-surface pb-[calc(3.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_oklch(0.2_0.02_25/0.12)] lg:bottom-0 lg:pb-0"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-body"
        lang={lang}
      >
        <div className="mx-auto max-w-page px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="min-w-0 max-w-prose flex-1">
              <p id="cookie-consent-title" className="font-display text-h3 font-bold text-ink">
                {en ? 'Cookies on Nagarik Watch' : 'नागरिक वाचमा कुकी'}
              </p>
              <p id="cookie-consent-body" className="mt-2 text-body leading-relaxed text-ink-soft">
                {en
                  ? 'Essential cookies keep the site working. Optional cookies help with recommendations, privacy-friendly analytics, and measuring our own house ads. Nothing optional runs until you choose.'
                  : 'आवश्यक कुकीले साइट चलाउँछ। वैकल्पिक कुकी सिफारिस, गोपनीयता-मैत्री एनालिटिक्स, र हाम्रै विज्ञापन मापनका लागि हुन्। तपाईंले छनोट नगरेसम्म वैकल्पिक कुकी चल्दैनन्।'}{' '}
                <Link
                  href={localizeHref(locale, '/cookies')}
                  className="font-semibold text-brand-strong underline-offset-2 hover:underline"
                >
                  {en ? 'Cookie policy' : 'कुकी नीति'}
                </Link>
              </p>

              {customize ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <CategoryToggle
                    locale={locale}
                    titleEn="Personalisation"
                    titleNe="व्यक्तिगत"
                    descEn="Saved stories, interests, local desk ranking"
                    descNe="सुरक्षित लेख, रुचि, स्थानीय डेस्क क्रम"
                    href={localizeHref(locale, '/cookies#personalization')}
                    checked={personalization}
                    onChange={setPersonalization}
                  />
                  <CategoryToggle
                    locale={locale}
                    titleEn="Analytics"
                    titleNe="एनालिटिक्स"
                    descEn="Privacy-friendly visit counts"
                    descNe="गोपनीयता-मैत्री भिजिट गणना"
                    href={localizeHref(locale, '/cookies#analytics')}
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <CategoryToggle
                    locale={locale}
                    titleEn="Advertising measure"
                    titleNe="विज्ञापन मापन"
                    descEn="First-party house-ad clicks only"
                    descNe="घरको विज्ञापन क्लिक मात्र"
                    href={localizeHref(locale, '/cookies#advertising')}
                    checked={advertising}
                    onChange={setAdvertising}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[16rem]">
              <button
                ref={initialFocusRef}
                type="button"
                onClick={() =>
                  decide({ personalization: false, analytics: false, advertising: false })
                }
                className="inline-flex min-h-12 w-full items-center justify-center border border-rule bg-surface px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
              >
                {en ? 'Essential only' : 'आवश्यक मात्र'}
              </button>
              {customize ? (
                <button
                  type="button"
                  onClick={() => decide({ personalization, analytics, advertising })}
                  className="inline-flex min-h-12 w-full items-center justify-center border border-brand bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
                >
                  {en ? 'Save choices' : 'छनोट सुरक्षित गर्नुहोस्'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCustomize(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
                  >
                    {en ? 'Choose options' : 'विकल्प छान्नुहोस्'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      decide({ personalization: true, analytics: true, advertising: true })
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center border border-brand bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
                  >
                    {en ? 'Accept optional' : 'वैकल्पिक स्वीकार'}
                  </button>
                </>
              )}
            </div>
          </div>
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
  href,
  checked,
  onChange,
}: {
  locale: Locale
  titleEn: string
  titleNe: string
  descEn: string
  descNe: string
  href: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 border border-rule bg-surface-raised px-3 py-3 text-meta text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-1 h-4 w-4 accent-brand"
      />
      <span>
        <span className="block font-semibold text-ink">
          {locale === 'en' ? titleEn : titleNe}
        </span>
        <span className="mt-1 block leading-snug">
          {locale === 'en' ? descEn : descNe}{' '}
          <Link href={href} className="font-semibold text-brand-strong underline-offset-2 hover:underline">
            {locale === 'en' ? 'Details' : 'विवरण'}
          </Link>
        </span>
      </span>
    </label>
  )
}
