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
}

/** Dense topics rail under the category desk, with a search affordance. */
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
      aria-label={locale === 'en' ? 'Topics' : 'विषय'}
      className="nw-masthead__topics border-b border-rule bg-surface-raised"
    >
      <div className="mx-auto flex max-w-page items-center gap-3 px-3 py-1.5 sm:px-4">
        <ul className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topics.map((topic, index) => {
            const active = pathsMatch(pathname, topic.href)
            return (
              <li key={`${topic.href}-${topic.label}`} className="flex shrink-0 items-center">
                {index > 0 ? (
                  <span className="mx-2 h-3 w-px bg-rule" aria-hidden="true" />
                ) : null}
                <Link
                  href={topic.href}
                  lang={topic.lang ?? (locale === 'en' ? 'en' : 'ne')}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex min-h-8 items-center whitespace-nowrap text-caption font-bold text-brand-strong'
                      : 'inline-flex min-h-8 items-center whitespace-nowrap text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-ink'
                  }
                >
                  {topic.label}
                </Link>
              </li>
            )
          })}
        </ul>
        {searchHref ? (
          <Link
            href={searchHref}
            className="hidden min-h-8 shrink-0 items-center gap-2 rounded-md border border-rule bg-surface px-3 text-caption font-semibold text-mute transition-colors duration-fast ease-out-quint hover:border-ink-soft hover:text-ink sm:inline-flex"
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
