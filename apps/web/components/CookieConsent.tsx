'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { OverlayDialog } from '@/components/overlays/OverlayDialog'
import { IconClose } from '@/components/icons/PortalIcons'
import { localizeHref } from '@/lib/i18n/locales'
import {
  CONSENT_OPEN_EVENT,
  CONSENT_POLICY_VERSION,
  type ConsentChoice,
  ensureConsentCookie,
  readConsent,
  writeConsent,
} from '@/lib/reader/consent'
import { getAdModeClient } from '@/lib/ads-client'

type PreferencesSource = 'banner' | 'settings'

export function CookieConsent({ locale }: { locale: Locale }) {
  const [bannerVisible, setBannerVisible] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [preferencesSource, setPreferencesSource] = useState<PreferencesSource>('banner')
  const [personalization, setPersonalization] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [advertising, setAdvertising] = useState(false)
  const dialogId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'

  useEffect(() => {
    function applyChoice(choice: ConsentChoice) {
      setPersonalization(choice.personalization)
      setAnalytics(choice.analytics)
      setAdvertising(choice.advertising)
    }

    const choice = readConsent()
    if (!choice) {
      setBannerVisible(true)
    } else {
      ensureConsentCookie()
      applyChoice(choice)
    }

    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ mode?: string }>).detail
      const existing = readConsent()
      if (existing) applyChoice(existing)

      if (detail?.mode === 'banner') {
        setPreferencesOpen(false)
        setBannerVisible(true)
        return
      }

      setPreferencesSource(existing ? 'settings' : 'banner')
      setBannerVisible(!existing)
      setPreferencesOpen(true)
    }

    window.addEventListener(CONSENT_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen)
  }, [])

  function decide(next: Pick<ConsentChoice, 'personalization' | 'analytics' | 'advertising'>) {
    writeConsent({
      essential: true,
      personalization: next.personalization,
      analytics: next.analytics,
      advertising: next.advertising,
      decidedAt: new Date().toISOString(),
      version: CONSENT_POLICY_VERSION,
    })
    setPreferencesSource('settings')
    setPreferencesOpen(false)
    setBannerVisible(false)
  }

  function openPreferences() {
    setPreferencesSource('banner')
    setPreferencesOpen(true)
  }

  function closePreferences() {
    setPreferencesOpen(false)
    setBannerVisible(preferencesSource === 'banner')
  }

  return (
    <>
      {bannerVisible ? (
        <section
          className="nw-cookie-banner fixed inset-x-0 z-[35] border-t border-rule bg-surface shadow-overlay sm:inset-x-auto sm:left-6 sm:w-[min(28rem,calc(100vw-3rem))] sm:border"
          role="region"
          aria-labelledby={`${dialogId}-banner-title`}
          aria-describedby={`${dialogId}-banner-body`}
          lang={lang}
          data-cookie-banner="compact"
        >
          <div className="px-3 py-3 sm:px-5 sm:py-4">
            <h2
              id={`${dialogId}-banner-title`}
              className="font-display text-meta font-extrabold text-ink sm:text-h3"
            >
              {en ? 'Cookie choices' : 'कुकी छनोट'}
            </h2>
            <p
              id={`${dialogId}-banner-body`}
              className="mt-1 text-caption leading-relaxed text-ink-soft sm:mt-2 sm:text-meta"
            >
              {en
                ? 'Essential cookies keep sign-in working. Optional cookies help recommendations and measurement.'
                : 'आवश्यक कुकीले लगइन चलाउँछ। वैकल्पिक कुकी सिफारिस र मापनका लागि।'}{' '}
              <Link
                href={localizeHref(locale, '/cookies')}
                className="font-semibold text-brand-strong underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {en ? 'Policy' : 'नीति'}
              </Link>
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  decide({ personalization: false, analytics: false, advertising: false })
                }
                className="inline-flex min-h-11 items-center justify-center border border-rule bg-surface px-2 text-caption font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-3 sm:text-meta"
              >
                {en ? 'Essential only' : 'आवश्यक मात्र'}
              </button>
              <button
                type="button"
                onClick={() =>
                  decide({ personalization: true, analytics: true, advertising: true })
                }
                className="inline-flex min-h-11 items-center justify-center border border-brand bg-brand px-2 text-caption font-extrabold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-3 sm:text-meta"
              >
                {en ? 'Accept optional' : 'वैकल्पिक स्वीकार'}
              </button>
            </div>
            <button
              type="button"
              onClick={openPreferences}
              className="mt-1 inline-flex min-h-11 w-full items-center justify-center text-caption font-semibold text-brand-strong underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:text-meta"
            >
              {en ? 'Customize' : 'अनुकूलन'}
            </button>
          </div>
        </section>
      ) : null}

      <OverlayDialog
        id={dialogId}
        open={preferencesOpen}
        onClose={closePreferences}
        labelledBy={titleId}
        describedBy={descriptionId}
        variant="preferences"
        className="nw-cookie-preferences"
      >
        <div className="flex max-h-[min(84dvh,40rem)] flex-col" lang={lang}>
          <div className="flex items-start justify-between gap-4 border-b border-rule px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-h2 font-extrabold text-ink">
                {en ? 'Cookie choices' : 'कुकी छनोट'}
              </h2>
              <p id={descriptionId} className="mt-1 text-meta leading-relaxed text-ink-soft">
                {en
                  ? 'Essential cookies keep sign-in and language working. Choose optional categories below.'
                  : 'आवश्यक कुकीले लगइन र भाषा चलाउँछ। तल वैकल्पिक वर्ग छान्नुहोस्।'}{' '}
                <Link
                  href={localizeHref(locale, '/cookies')}
                  onClick={closePreferences}
                  className="font-semibold text-brand-strong underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {en ? 'Cookie policy' : 'कुकी नीति'}
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={closePreferences}
              aria-label={en ? 'Close cookie preferences' : 'कुकी छनोट बन्द गर्नुहोस्'}
              autoFocus
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <IconClose width={19} height={19} />
            </button>
          </div>

          <div className="grid flex-1 gap-2 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
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
              titleEn="Advertising"
              titleNe="विज्ञापन"
              descEn={
                getAdModeClient() === 'network'
                  ? 'House measurement; AdSense/GAM only with consent'
                  : 'House-ad views and clicks only'
              }
              descNe={
                getAdModeClient() === 'network'
                  ? 'घर मापन; सहमतिपछि मात्र AdSense/GAM'
                  : 'घरको विज्ञापन दृश्य/क्लिक मात्र'
              }
              checked={advertising}
              onChange={setAdvertising}
            />
          </div>

          <div className="grid gap-2 border-t border-rule px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5">
            <button
              type="button"
              onClick={() => decide({ personalization, analytics, advertising })}
              className="inline-flex min-h-11 w-full items-center justify-center border border-brand bg-brand px-4 text-meta font-extrabold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {en ? 'Save choices' : 'छनोट सुरक्षित गर्नुहोस्'}
            </button>
            <button
              type="button"
              onClick={closePreferences}
              className="inline-flex min-h-11 items-center justify-center px-3 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {preferencesSource === 'banner'
                ? en
                  ? 'Back'
                  : 'पछाडि'
                : en
                  ? 'Cancel'
                  : 'रद्द गर्नुहोस्'}
            </button>
          </div>
        </div>
      </OverlayDialog>
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
    <label className="flex min-h-16 cursor-pointer items-start gap-3 border border-rule bg-surface-raised px-3 py-3 text-meta text-ink-soft transition-colors duration-fast ease-out-quint has-[:checked]:border-brand has-[:checked]:bg-brand-tint/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
      />
      <span>
        <span className="block font-semibold text-ink">{locale === 'en' ? titleEn : titleNe}</span>
        <span className="mt-0.5 block text-caption leading-snug">
          {locale === 'en' ? descEn : descNe}
        </span>
      </span>
    </label>
  )
}
