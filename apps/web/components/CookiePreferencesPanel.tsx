'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import {
  CONSENT_POLICY_VERSION,
  type ConsentChoice,
  defaultConsent,
  readConsent,
  writeConsent,
} from '@/lib/reader/consent'

export function CookiePreferencesPanel({ locale }: { locale: Locale }) {
  const [choice, setChoice] = useState<ConsentChoice>(defaultConsent())
  const [saved, setSaved] = useState(false)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'

  useEffect(() => {
    setChoice(readConsent() ?? defaultConsent())
  }, [])

  function save(next: ConsentChoice) {
    writeConsent({
      ...next,
      essential: true,
      version: CONSENT_POLICY_VERSION,
      decidedAt: new Date().toISOString(),
    })
    setChoice(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <section
      id="cookie-preferences"
      className="mt-10 scroll-mt-24 rounded-lg border border-rule bg-surface-raised p-5 sm:p-6"
      aria-label={en ? 'Manage cookie preferences' : 'कुकी रोजाइ व्यवस्थापन'}
      lang={lang}
    >
      <h2 className="font-display text-h2 font-bold text-ink">
        {en ? 'Your cookie choices' : 'तपाईंका कुकी रोजाइ'}
      </h2>
      <p className="mt-2 text-body leading-relaxed text-ink-soft">
        {en
          ? 'Change these anytime. Essential storage always stays on so login, language and security work.'
          : 'यिनलाई जुनसुकै बेला परिवर्तन गर्न सकिन्छ। लगइन, भाषा र सुरक्षाका लागि आवश्यक भण्डारण सधैं सक्रिय रहन्छ।'}
      </p>

      <ul className="mt-5 space-y-0 divide-y divide-rule">
        <li className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="font-semibold text-ink">{en ? 'Essential' : 'आवश्यक'}</p>
            <p className="mt-1 text-meta leading-snug text-mute">
              {en
                ? 'Session, locale, theme, CSRF and security cookies. Always required.'
                : 'सेसन, भाषा, थिम, CSRF र सुरक्षाका कुकी। सधैं आवश्यक।'}
            </p>
          </div>
          <span className="mt-1 shrink-0 rounded-md bg-brand-tint px-2.5 py-1 text-caption font-bold uppercase tracking-wide text-brand-strong">
            {en ? 'On' : 'सक्रिय'}
          </span>
        </li>
        <li className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="font-semibold text-ink">{en ? 'Personalisation' : 'व्यक्तिगत'}</p>
            <p className="mt-1 text-meta leading-snug text-mute">
              {en
                ? 'Saved stories, reading history and recommendation interests in this browser.'
                : 'यो ब्राउजरमा सुरक्षित लेख, पढाइ इतिहास र सिफारिस रुचि।'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={choice.personalization}
            onChange={(event) =>
              setChoice((prev) => ({ ...prev, personalization: event.currentTarget.checked }))
            }
            className="mt-1 h-5 w-5 accent-brand"
            aria-label={en ? 'Allow personalisation' : 'व्यक्तिगत अनुमति'}
          />
        </li>
        <li className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="font-semibold text-ink">{en ? 'Analytics' : 'एनालिटिक्स'}</p>
            <p className="mt-1 text-meta leading-snug text-mute">
              {en
                ? 'Privacy-friendly Plausible counts only. No advertising profiles.'
                : 'गोपनीयता-मैत्री Plausible भिजिट गणना मात्र। विज्ञापन प्रोफाइल छैन।'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={choice.analytics}
            onChange={(event) =>
              setChoice((prev) => ({ ...prev, analytics: event.currentTarget.checked }))
            }
            className="mt-1 h-5 w-5 accent-brand"
            aria-label={en ? 'Allow analytics' : 'एनालिटिक्स अनुमति'}
          />
        </li>
        <li className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="font-semibold text-ink">
              {en ? 'Advertising measurement' : 'विज्ञापन मापन'}
            </p>
            <p className="mt-1 text-meta leading-snug text-mute">
              {en
                ? 'First-party house-ad impression and click counts on this site only. No third-party ad networks.'
                : 'यस साइटका घरेलु विज्ञापन दृश्य/क्लिक मात्र। तेस्रो-पक्ष विज्ञापन नेटवर्क छैन।'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={choice.advertising}
            onChange={(event) =>
              setChoice((prev) => ({ ...prev, advertising: event.currentTarget.checked }))
            }
            className="mt-1 h-5 w-5 accent-brand"
            aria-label={en ? 'Allow advertising measurement' : 'विज्ञापन मापन अनुमति'}
          />
        </li>
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(choice)}
          className="inline-flex min-h-11 items-center rounded-md border border-brand bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
        >
          {en ? 'Save preferences' : 'रोजाइ सुरक्षित गर्नुहोस्'}
        </button>
        <button
          type="button"
          onClick={() =>
            save({
              essential: true,
              personalization: true,
              analytics: true,
              advertising: true,
              decidedAt: new Date().toISOString(),
              version: CONSENT_POLICY_VERSION,
            })
          }
          className="inline-flex min-h-11 items-center rounded-md border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
        >
          {en ? 'Accept all' : 'सबै स्वीकार'}
        </button>
        <button
          type="button"
          onClick={() =>
            save({
              essential: true,
              personalization: false,
              analytics: false,
              advertising: false,
              decidedAt: new Date().toISOString(),
              version: CONSENT_POLICY_VERSION,
            })
          }
          className="inline-flex min-h-11 items-center rounded-md border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
        >
          {en ? 'Reject optional' : 'वैकल्पिक अस्वीकार'}
        </button>
        {saved ? (
          <span className="text-meta font-semibold text-brand-strong" role="status">
            {en ? 'Saved.' : 'सुरक्षित भयो।'}
          </span>
        ) : null}
      </div>
    </section>
  )
}
