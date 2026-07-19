import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

const SERVICE_LINKS = [
  { href: '/latest', titleNe: 'ताजा', titleEn: 'Latest' },
  { href: '/trending', titleNe: 'ट्रेन्डिङ', titleEn: 'Trending' },
  { href: '/most-read', titleNe: 'धेरै पढिएको', titleEn: 'Most read' },
  { href: '/market', titleNe: 'बजार', titleEn: 'Market' },
  { href: '/utilities', titleNe: 'उपयोगी', titleEn: 'Utilities' },
  { href: '/fact-check', titleNe: 'तथ्य-जाँच', titleEn: 'Fact check' },
  { href: '/submit-story', titleNe: 'टिप', titleEn: 'Tip' },
] as const

type HomeDeskRailProps = {
  locale: Locale
  categories?: Category[]
  className?: string
}

/** Compact scan rail under the masthead: desks + service shortcuts. Touch targets ≥44px. */
export function HomeDeskRail({ locale, categories = [], className }: HomeDeskRailProps) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const desks = categories.slice(0, 8)

  return (
    <nav
      id="desks"
      aria-label={english ? 'Quick desks' : 'द्रुत विभाग'}
      className={className}
    >
      <ul className="flex gap-0 overflow-x-auto border-y border-rule bg-surface-raised [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {SERVICE_LINKS.map((item) => (
          <li key={item.href} className="shrink-0 border-r border-rule last:border-r-0">
            <Link
              href={localizeHref(locale, item.href)}
              className="inline-flex min-h-11 items-center whitespace-nowrap px-3.5 text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-surface hover:text-brand-strong focus-visible:bg-surface focus-visible:text-brand-strong"
              lang={lang}
            >
              {english ? item.titleEn : item.titleNe}
            </Link>
          </li>
        ))}
        {desks.map((category) => (
          <li key={category.slug} className="shrink-0 border-r border-rule last:border-r-0">
            <Link
              href={localizeHref(locale, `/${category.slug}`)}
              className="inline-flex min-h-11 items-center whitespace-nowrap px-3.5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:bg-surface hover:text-brand-strong focus-visible:bg-surface focus-visible:text-brand-strong"
              lang={english && category.nameEn ? 'en' : 'ne'}
            >
              {english && category.nameEn ? category.nameEn : category.nameNe}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
