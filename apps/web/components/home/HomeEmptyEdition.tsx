import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'

/**
 * Service notice for a temporarily unavailable edition. Deliberately compact:
 * this is a status message, not a landing hero.
 */
export function HomeEmptyEdition({ locale }: { locale: Locale }) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-3 py-10 sm:px-4 sm:py-14" lang={lang}>
      <section
        className="mx-auto max-w-xl border border-rule bg-surface-raised px-4 py-5 sm:px-6 sm:py-6"
        aria-labelledby="empty-edition-title"
      >
        <p className="text-caption font-bold text-brand-strong">
          {english ? 'Newsroom update' : 'समाचार कक्ष अपडेट'}
        </p>
        <h1
          id="empty-edition-title"
          className="mt-2 font-display text-h3 font-extrabold leading-snug text-ink"
        >
          {english ? 'Homepage stories cannot be shown right now.' : 'मुखपृष्ठका समाचार अहिले देखाउन सकिएन।'}
        </h1>
        <p className="mt-2 text-body leading-relaxed text-ink-soft">
          {english
            ? 'The edition is refreshing. The latest-news desk and the Nepali calendar remain available.'
            : 'संस्करण फेरि अद्यावधिक भइरहेको छ। ताजा समाचार र नेपाली पात्रो उपलब्ध छन्।'}
        </p>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta font-bold">
          <Link
            href={localizeHref(locale, '/latest')}
            className="text-brand-strong underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'Latest news →' : 'ताजा समाचार →'}
          </Link>
          <Link
            href={patroEntryHref(locale)}
            className="text-ink underline-offset-4 hover:text-brand-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'Nepali calendar →' : 'नेपाली पात्रो →'}
          </Link>
        </p>
      </section>
    </div>
  )
}
