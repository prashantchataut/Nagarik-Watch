import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, swapLocale } from '@/lib/i18n/locales'
import { ThemeToggle } from '@/components/ThemeToggle'

type MastheadProps = {
  locale: Locale
  navCategories: Category[]
}

/**
 * Site chrome top — the wordmark, the BS/AD date line, the primary nav, and the locale +
 * search affordances. Server component: the localized date is computed from "today" at
 * render, and nav categories come from the content source.
 *
 * Sticky (Task 1.4): the bar stays pinned with a translucent surface so content scrolls
 * beneath it. The locale toggle preserves context (swapLocale) and every nav link is a
 * real keyboard-focusable anchor.
 */
export function Masthead({ locale, navCategories }: MastheadProps) {
  const dict = getDictionary(locale)
  const today = new Date().toISOString()
  const dateLabel = formatDate(today, locale)

  const homeHref = localizeHref(locale, '/')
  const searchHref = localizeHref(locale, '/search')
  const toggleHref = swapLocale('/')

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={homeHref}
            className="font-display text-h1 leading-none text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
          >
            <span lang="ne" className="block">
              {dict.siteName}
            </span>
            <span className="block text-meta text-ink-soft" lang="en">
              {dict.siteNameEn}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span
              className="hidden text-meta text-ink-soft sm:inline"
              lang={locale === 'en' ? 'en' : 'ne'}
            >
              {dict.mastheadDate(dateLabel)}
            </span>
            <Link
              href={searchHref}
              className="rounded-sm p-2 text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong"
              aria-label={dict.search}
            >
              <SearchIcon />
            </Link>
            <ThemeToggle locale={locale} />
            <Link
              href={toggleHref}
              className="rounded-sm border border-rule px-3 py-1.5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
              lang={locale === 'en' ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {dict.localeToggleTo}
            </Link>
          </div>
        </div>

        <nav aria-label={dict.primaryNav} className="border-t border-rule pt-2">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <li>
              <Link
                href={homeHref}
                className="text-body font-semibold text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
              >
                {dict.home}
              </Link>
            </li>
            {navCategories.map((c) => {
              const label = locale === 'en' && c.nameEn ? c.nameEn : c.nameNe
              const catLang = locale === 'en' && c.nameEn ? 'en' : 'ne'
              return (
                <li key={c.slug}>
                  <Link
                    href={localizeHref(locale, `/${c.slug}`)}
                    className="text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                    lang={catLang}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
