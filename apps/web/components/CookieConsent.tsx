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
    <section
      ref={dialogRef}
      className="fixed inset-x-0 z-50 border-t border-rule bg-surface shadow-[0_-8px_24px_rgba(0,0,0,0.08)] bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:bottom-0"
      role="dialog"
      aria-modal="true"
      aria-label={locale === 'en' ? 'Cookie settings' : 'कुकी सेटिङ'}
      lang={lang}
    >
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:flex-row lg:items-end lg:gap-6 lg:pb-4">
        <div className="min-w-0 flex-1">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong">
            {locale === 'en' ? 'Cookies & privacy' : 'कुकी र गोपनीयता'}
          </p>
          <p className="mt-1 text-body leading-relaxed text-ink-soft">
            {locale === 'en'
              ? 'Essential storage keeps the site working. Optional choices cover personalisation, analytics, and first-party ad measurement — never sold, never third-party ad trackers.'
              : 'आवश्यक भण्डारणले साइट चलाउँछ। वैकल्पिक रोजाइ: व्यक्तिगत सिफारिस, एनालिटिक्स, र पहिलो-पक्ष विज्ञापन मापन — बेचिँदैन, तेस्रो-पक्ष विज्ञापन ट्र्याकर छैन।'}{' '}
            <Link
              href={localizeHref(locale, '/cookies')}
              className="font-semibold text-ink underline-offset-2 hover:underline"
            >
              {locale === 'en' ? 'Cookie policy' : 'कुकी नीति'}
            </Link>
          </p>

          {customize ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <CategoryToggle
                locale={locale}
                titleEn="Personalisation"
                titleNe="व्यक्तिगत"
                descEn="Saved stories, interests, continue reading"
                descNe="सुरक्षित लेख, रुचि, जारी राख्नुहोस्"
                href={localizeHref(locale, '/cookies#personalization')}
                checked={personalization}
                onChange={setPersonalization}
              />
              <CategoryToggle
                locale={locale}
                titleEn="Analytics"
                titleNe="एनालिटिक्स"
                descEn="Privacy-friendly visit counts (Plausible)"
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

        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <button
            ref={initialFocusRef}
            type="button"
            onClick={() =>
              decide({ personalization: false, analytics: false, advertising: false })
            }
            className="inline-flex min-h-11 items-center justify-center border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
          >
            {locale === 'en' ? 'Essential only' : 'आवश्यक मात्र'}
          </button>
          {customize ? (
            <button
              type="button"
              onClick={() => decide({ personalization, analytics, advertising })}
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
                onClick={() =>
                  decide({ personalization: true, analytics: true, advertising: true })
                }
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
    <label className="flex items-start gap-2 border border-rule bg-surface-raised px-3 py-2.5 text-meta text-ink-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-0.5 h-4 w-4 accent-brand"
      />
      <span>
        <span className="block font-semibold text-ink">
          {locale === 'en' ? titleEn : titleNe}
        </span>
        <span className="mt-0.5 block">
          {locale === 'en' ? descEn : descNe}{' '}
          <Link href={href} className="underline-offset-2 hover:underline">
            {locale === 'en' ? 'Details' : 'विवरण'}
          </Link>
        </span>
      </span>
    </label>
  )
}
