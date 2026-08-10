import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'
import { IconCalendar, IconChart } from '@/components/icons/PortalIcons'

type HomeEmptyEditionProps = {
  locale: Locale
  categories: Category[]
}

/**
 * High-craft placeholder edition when newsroom articles are loading or unseeded.
 * Provides rich category desks, utility tiles, and discovery channels.
 */
export function HomeEmptyEdition({ locale, categories }: HomeEmptyEditionProps) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <div className="pb-16">
      {/* Hero Welcome Zone */}
      <section
        className="mx-auto max-w-page px-4 pb-8 pt-8 sm:pt-12 text-center"
        lang={lang}
        aria-labelledby="empty-edition-title"
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <span className="rounded-full bg-brand-tint px-3 py-1 text-caption font-extrabold tracking-wider text-brand-strong uppercase">
            Nagarik Watch • नागरिक वाच
          </span>
          <h1
            id="empty-edition-title"
            className="mt-3 text-pretty font-display text-[clamp(2.2rem,5vw,3.75rem)] font-black leading-[1.08] tracking-[-0.03em] text-ink"
          >
            {english
              ? 'Independent News & Public Service Portal'
              : 'नेपालको स्वतन्त्र समाचार र नागरिक सेवा'}
          </h1>
          <p className="mt-3.5 max-w-xl text-pretty text-body leading-relaxed text-ink-soft sm:text-body-lg">
            {english
              ? 'Devanagari-first journalism, public-service data, Bikram Sambat calendar, and verified news analysis.'
              : 'मौलिक रिपोर्टिङ, सार्वजनिक सरोकारका तथ्य, बिक्रम संवत् पात्रो र विश्लेषणात्मक नेपाली पत्रकारिता।'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={localizeHref(locale, '/latest')}
              className="inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-meta font-bold text-paper transition-all duration-fast ease-out-quint hover:bg-brand-strong active:scale-95 shadow-sm"
            >
              {english ? 'Read Latest' : 'ताजा समाचार'}
            </Link>
            <Link
              href={patroEntryHref(locale)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-brand/40 bg-surface-raised px-5 text-meta font-bold text-ink transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong active:scale-95"
            >
              <IconCalendar width={16} height={16} className="text-brand-strong" />
              <span>{english ? 'Nepali Calendar' : 'नेपाली पात्रो'}</span>
            </Link>
            <Link
              href={localizeHref(locale, '/submit-story')}
              className="inline-flex min-h-11 items-center rounded-md border border-rule bg-surface px-4 text-meta font-semibold text-ink-soft transition-all duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
            >
              {english ? 'Send a Tip' : 'टिप पठाउनुहोस्'}
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Utilities Strip */}
      <section className="mx-auto max-w-page px-4 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href={patroEntryHref(locale)}
            className="flex items-center gap-3 rounded-lg border border-rule bg-surface-raised/70 p-3.5 transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40 hover:text-brand-strong"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand-strong">
              <IconCalendar width={20} height={20} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-body font-bold text-ink truncate">
                {english ? 'Patro' : 'नेपाली पात्रो'}
              </p>
              <p className="text-[0.72rem] text-mute truncate">
                {english ? 'Bikram Sambat' : 'बि.सं. २०८३'}
              </p>
            </div>
          </Link>

          <Link
            href={localizeHref(locale, '/preeti-unicode')}
            className="flex items-center gap-3 rounded-lg border border-rule bg-surface-raised/70 p-3.5 transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40 hover:text-brand-strong"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand-strong font-extrabold">
              ⌨
            </div>
            <div className="min-w-0">
              <p className="font-display text-body font-bold text-ink truncate">
                {english ? 'Unicode' : 'युनिकोड'}
              </p>
              <p className="text-[0.72rem] text-mute truncate">
                {english ? 'Preeti Converter' : 'प्रिती रूपान्तरण'}
              </p>
            </div>
          </Link>

          <Link
            href={localizeHref(locale, '/market')}
            className="flex items-center gap-3 rounded-lg border border-rule bg-surface-raised/70 p-3.5 transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40 hover:text-brand-strong"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand-strong">
              <IconChart width={20} height={20} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-body font-bold text-ink truncate">
                {english ? 'NEPSE' : 'सेयर बजार'}
              </p>
              <p className="text-[0.72rem] text-mute truncate">
                {english ? 'Live Rates' : 'सुन चाँदी / विनिमय'}
              </p>
            </div>
          </Link>

          <Link
            href={localizeHref(locale, '/utilities/date-converter')}
            className="flex items-center gap-3 rounded-lg border border-rule bg-surface-raised/70 p-3.5 transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40 hover:text-brand-strong"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand-strong font-bold">
              ⇄
            </div>
            <div className="min-w-0">
              <p className="font-display text-body font-bold text-ink truncate">
                {english ? 'Date Converter' : 'मिति रूपान्तरण'}
              </p>
              <p className="text-[0.72rem] text-mute truncate">
                {english ? 'BS ⇄ AD' : 'बि.सं. ⇄ ई.सं.'}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Category Desks Directory */}
      <section
        className="mx-auto max-w-page border-t-2 border-brand px-4 pb-8 pt-8"
        aria-labelledby="empty-desks-title"
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="empty-desks-title"
            className="font-display text-h2 font-extrabold text-ink"
            lang={lang}
          >
            {english ? 'News Departments' : 'समाचार विभागहरू'}
          </h2>
          <span className="text-caption font-bold text-mute">Nagarik Watch Newsroom</span>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={localizeHref(locale, `/${category.slug}`)}
                className="group flex min-h-12 items-center justify-between gap-2 rounded-md border border-rule bg-surface-raised/50 p-3 transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/30"
              >
                <strong
                  className="font-display text-body font-bold text-ink group-hover:text-brand-strong"
                  lang={english && category.nameEn ? 'en' : 'ne'}
                >
                  {english && category.nameEn ? category.nameEn : category.nameNe}
                </strong>
                <span
                  className="text-mute transition-transform duration-fast ease-out-quint group-hover:translate-x-1 group-hover:text-brand-strong"
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
