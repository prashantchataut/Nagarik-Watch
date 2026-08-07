'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { pathsMatch } from '@/lib/i18n/locales'
import { IconSearch } from '@/components/icons/PortalIcons'

export type TopicChip = {
  href: string
  label: string
  lang?: string
  /** Optional small mark / thumb URL (data: SVG ok at this size). */
  imageUrl?: string
}

/**
 * Trending topic pills under the category desk (Ratopati-style outline chips).
 * Live topics — not hub synonyms. Search stays desktop-only here.
 */
export function TopicsStrip({
  locale,
  topics,
  searchHref,
}: {
  locale: Locale
  topics: TopicChip[]
  searchHref?: string
}) {
  const pathname = usePathname() ?? '/'
  if (!topics.length && !searchHref) return null

  return (
    <nav
      aria-label={locale === 'en' ? 'Trending topics' : 'ट्रेन्डिङ विषय'}
      className="nw-masthead__topics border-b border-rule bg-surface"
    >
      <div className="mx-auto flex max-w-page items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
        {topics.length ? (
          <ul className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topics.map((topic) => {
              const active = pathsMatch(pathname, topic.href)
              return (
                <li key={`${topic.href}-${topic.label}`} className="shrink-0">
                  <Link
                    href={topic.href}
                    lang={topic.lang ?? (locale === 'en' ? 'en' : 'ne')}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-brand bg-brand-tint px-2.5 text-caption font-bold text-brand-strong'
                        : 'inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-rule bg-surface px-2.5 text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-ink-soft hover:text-ink'
                    }
                  >
                    {topic.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- tiny chip mark; next/image is overkill
                      <img
                        src={topic.imageUrl}
                        alt=""
                        width={14}
                        height={14}
                        className="h-3.5 w-3.5 rounded-sm object-cover"
                        aria-hidden="true"
                      />
                    ) : null}
                    {topic.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p
            className="min-w-0 flex-1 truncate text-caption text-mute"
            lang={locale === 'en' ? 'en' : 'ne'}
          >
            {locale === 'en' ? 'Topics appear as stories publish.' : 'समाचार प्रकाशित हुँदा विषय देखिन्छन्।'}
          </p>
        )}
        {searchHref ? (
          <Link
            href={searchHref}
            className="hidden min-h-8 shrink-0 items-center gap-2 rounded-sm border border-rule bg-surface px-3 text-caption font-semibold text-mute transition-colors duration-fast ease-out-quint hover:border-ink-soft hover:text-ink sm:inline-flex"
            lang={locale === 'en' ? 'en' : 'ne'}
          >
            <IconSearch />
            <span>{locale === 'en' ? 'Search' : 'खोज्नुहोस्'}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
