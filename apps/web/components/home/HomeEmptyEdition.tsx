import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

type HomeEmptyEditionProps = {
  locale: Locale
  categories: Category[]
}

/**
 * Public empty homepage when the CMS has no lead story yet.
 * Reader-facing only: no admin/dev copy (product skill + Option A).
 * Category discovery lives in masthead primary nav + footer; no duplicate desk rail.
 */
export function HomeEmptyEdition({ locale, categories }: HomeEmptyEditionProps) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <div className="pb-16">
      <section
        className="mx-auto max-w-page px-4 pb-12 pt-10 sm:pt-14"
        lang={lang}
        aria-labelledby="empty-edition-title"
      >
        <p
          className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong"
          lang="en"
          translate="no"
        >
          Nagarik Watch
        </p>
        <h1
          id="empty-edition-title"
          className="mt-3 max-w-[16ch] text-pretty font-display text-[clamp(2.35rem,7vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink"
        >
          {english ? 'Independent news from Nepal.' : 'नेपालको स्वतन्त्र समाचार।'}
        </h1>
        <p className="mt-4 max-w-[38rem] text-body-lg leading-relaxed text-ink-soft">
          {english
            ? 'Original reporting and public-service information. Check Latest while the newsroom prepares today’s edition.'
            : 'मौलिक रिपोर्टिङ र सार्वजनिक सेवा सूचना। आजको संस्करण तयार हुँदै गर्दा ताजा समाचार हेर्नुहोस्।'}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={localizeHref(locale, '/latest')}
            className="inline-flex min-h-11 cursor-pointer items-center bg-brand px-5 text-meta font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'Read latest' : 'ताजा पढ्नुहोस्'}
          </Link>
          <Link
            href={localizeHref(locale, '/submit-story')}
            className="inline-flex min-h-11 cursor-pointer items-center border border-rule bg-surface px-5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'Send a tip' : 'टिप पठाउनुहोस्'}
          </Link>
          <Link
            href={localizeHref(locale, '/about')}
            className="inline-flex min-h-11 cursor-pointer items-center px-2 text-meta font-semibold text-ink-soft underline-offset-4 transition-colors duration-fast ease-out-quint hover:text-brand-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {english ? 'About us' : 'हाम्रो बारे'}
          </Link>
        </div>
      </section>

      <section
        className="mx-auto max-w-page border-t-2 border-ink px-4 pb-8 pt-8"
        aria-labelledby="empty-desks-title"
      >
        <h2 id="empty-desks-title" className="font-display text-h1 text-ink" lang={lang}>
          {english ? 'News desks' : 'समाचार विभाग'}
        </h2>
        <ul className="mt-3 columns-1 gap-x-10 sm:columns-2 lg:columns-3">
          {categories.map((category) => (
            <li key={category.slug} className="break-inside-avoid border-b border-rule">
              <Link
                href={localizeHref(locale, `/${category.slug}`)}
                className="group flex min-h-12 cursor-pointer items-center justify-between gap-3 py-3 transition-colors duration-fast ease-out-quint"
              >
                <strong
                  className="font-display text-body-lg text-ink group-hover:text-brand-strong"
                  lang={english && category.nameEn ? 'en' : 'ne'}
                >
                  {english && category.nameEn ? category.nameEn : category.nameNe}
                </strong>
                <span
                  className="text-mute transition-transform duration-fast ease-out-quint group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
