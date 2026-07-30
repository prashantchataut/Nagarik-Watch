import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

const HUBS = [
  { path: '/trending', ne: 'अहिले चर्चामा', en: 'Trending' },
  { path: '/most-read', ne: 'धेरै पढिएका', en: 'Most read' },
  { path: '/latest', ne: 'ताजा', en: 'Latest' },
] as const

/** Compact cross-links between ranked hub indexes. */
export function HubRelatedNav({
  locale,
  active,
}: {
  locale: Locale
  active: 'trending' | 'most-read' | 'latest'
}) {
  const english = locale === 'en'
  return (
    <nav
      className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-b border-rule pb-3 text-meta"
      aria-label={english ? 'Related lists' : 'सम्बन्धित सूची'}
    >
      {HUBS.map((hub) => {
        const slug = hub.path.slice(1) as typeof active
        const label = english ? hub.en : hub.ne
        const href = localizeHref(locale, hub.path)
        if (slug === active) {
          return (
            <span key={hub.path} className="font-extrabold text-brand-strong" aria-current="page">
              {label}
            </span>
          )
        }
        return (
          <Link
            key={hub.path}
            href={href}
            className="font-bold text-ink-soft underline-offset-4 transition-colors duration-fast ease-out-quint hover:text-brand-strong hover:underline"
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
