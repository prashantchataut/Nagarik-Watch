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
      className="mt-8 scroll-mt-24 border border-rule bg-surface-raised p-5"
      aria-label={locale === 'en' ? 'Manage cookie preferences' : 'कुकी रोजाइ व्यवस्थापन'}
      lang={lang}
    >
      <h2 className="font-display text-h2 font-bold text-ink">
        {locale === 'en' ? 'Your cookie choices' : 'तपाईंको कुकी रोजाइ'}
      </h2>
      <p className="mt-2 text-body text-ink-soft">
        {locale === 'en'
          ? 'Change these anytime. Essential storage always stays on so login, language and security work.'
          : 'जुनसुकै बेला बदल्न सकिन्छ। लगइन, भाषा र सुरक्षाका लागि आवश्यक भण्डारण सधैं सक्रिय रहन्छ।'}
      </p>

      <ul className="mt-5 space-y-3">
        <li id="essential" className="scroll-mt-28 flex items-start justify-between gap-4 border-b border-rule pb-3">
          <div>
            <p className="font-semibold text-ink">{locale === 'en' ? 'Essential' : 'आवश्यक'}</p>
            <p className="mt-1 text-meta text-mute">
              {locale === 'en'
                ? 'Session, locale, theme, CSRF and security cookies. Always required.'
                : 'सेसन, भाषा, थिम, CSRF र सुरक्षा। सधैं आवश्यक।'}
            </p>
          </div>
          <span className="mt-1 text-caption font-bold uppercase tracking-wide text-brand-strong">
            {locale === 'en' ? 'On' : 'सक्रिय'}
          </span>
        </li>
        <li id="personalization" className="scroll-mt-28 flex items-start justify-between gap-4 border-b border-rule pb-3">
          <div>
            <p className="font-semibold text-ink">{locale === 'en' ? 'Personalisation' : 'व्यक्तिगत'}</p>
            <p className="mt-1 text-meta text-mute">
              {locale === 'en'
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
            aria-label={locale === 'en' ? 'Allow personalisation' : 'व्यक्तिगत अनुमति'}
          />
        </li>
        <li id="analytics" className="scroll-mt-28 flex items-start justify-between gap-4 border-b border-rule pb-3">
          <div>
            <p className="font-semibold text-ink">{locale === 'en' ? 'Analytics' : 'एनालिटिक्स'}</p>
            <p className="mt-1 text-meta text-mute">
              {locale === 'en'
                ? 'Privacy-friendly Plausible counts only  -  no advertising profiles.'
                : 'गोपनीयता-मैत्री Plausible गणना मात्र  -  विज्ञापन प्रोफाइल छैन।'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={choice.analytics}
            onChange={(event) =>
              setChoice((prev) => ({ ...prev, analytics: event.currentTarget.checked }))
            }
            className="mt-1 h-5 w-5 accent-brand"
            aria-label={locale === 'en' ? 'Allow analytics' : 'एनालिटिक्स अनुमति'}
          />
        </li>
        <li id="advertising" className="scroll-mt-28 flex items-start justify-between gap-4 pb-1">
          <div>
            <p className="font-semibold text-ink">
              {locale === 'en' ? 'Advertising measurement' : 'विज्ञापन मापन'}
            </p>
            <p className="mt-1 text-meta text-mute">
              {locale === 'en'
                ? 'First-party house-ad impression and click counts on this site only. No third-party ad networks.'
                : 'यस साइटमा मात्र घरको विज्ञापन इम्प्रेसन/क्लिक। तेस्रो-पक्ष विज्ञापन नेटवर्क छैन।'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={choice.advertising}
            onChange={(event) =>
              setChoice((prev) => ({ ...prev, advertising: event.currentTarget.checked }))
            }
            className="mt-1 h-5 w-5 accent-brand"
            aria-label={locale === 'en' ? 'Allow advertising measurement' : 'विज्ञापन मापन अनुमति'}
          />
        </li>
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(choice)}
          className="inline-flex min-h-11 items-center border border-brand bg-brand px-4 text-meta font-bold text-surface hover:bg-brand-strong"
        >
          {locale === 'en' ? 'Save preferences' : 'रोजाइ सुरक्षित गर्नुहोस्'}
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
          className="inline-flex min-h-11 items-center border border-rule px-4 text-meta font-semibold text-ink hover:border-brand hover:text-brand-strong"
        >
          {locale === 'en' ? 'Accept all' : 'सबै स्वीकार'}
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
          className="inline-flex min-h-11 items-center border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
        >
          {locale === 'en' ? 'Reject optional' : 'वैकल्पिक अस्वीकार'}
        </button>
        {saved ? (
          <span className="text-meta font-semibold text-brand-strong" role="status">
            {locale === 'en' ? 'Saved.' : 'सुरक्षित भयो।'}
          </span>
        ) : null}
      </div>
    </section>
  )
}
