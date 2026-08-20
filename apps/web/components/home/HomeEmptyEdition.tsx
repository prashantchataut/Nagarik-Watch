import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'

export function HomeEmptyEdition({ locale }: { locale: Locale }) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8" lang={lang}>
      <section className="border-y border-rule py-5 sm:py-6" aria-labelledby="empty-edition-title">
        <p className="text-meta font-extrabold text-brand-strong">
          {english ? 'Newsroom update' : 'समाचार कक्ष अपडेट'}
        </p>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <h1
          id="empty-edition-title"
          className="mt-3 max-w-[30ch] font-display text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.2] text-ink"
        >
          {english ? 'Homepage stories cannot be shown right now.' : 'मुखपृष्ठका समाचार अहिले देखाउन सकिएन।'}
        </h1>
        <p className="mt-2 max-w-[44rem] text-body leading-relaxed text-ink-soft">
          {english
            ? 'The reader site is still available. You can open the latest-news desk or use the Nepali calendar while the edition refreshes.'
            : 'पाठक साइट उपलब्ध छ। संस्करण फेरि अद्यावधिक हुँदासम्म ताजा समाचार वा नेपाली पात्रो खोल्न सक्नुहुन्छ।'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={localizeHref(locale, '/latest')}
            className="inline-flex min-h-10 items-center bg-brand px-4 text-meta font-bold text-paper transition-colors hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'Latest news' : 'ताजा समाचार'}
          </Link>
          <Link
            href={patroEntryHref(locale)}
            className="inline-flex min-h-10 items-center border border-rule bg-surface-raised px-4 text-meta font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'Nepali calendar' : 'नेपाली पात्रो'}
          </Link>
        </div>
      </section>
    </div>
  )
}
