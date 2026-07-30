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

/** Dense topics rail under the category desk, with search. */
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
      <div className="mx-auto flex max-w-page items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4">
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {topics.map((topic) => {
            const active = pathsMatch(pathname, topic.href)
            const initial = topic.label.trim().charAt(0) || '·'
            return (
              <li key={`${topic.href}-${topic.label}`} className="shrink-0">
                <Link
                  href={topic.href}
                  lang={topic.lang ?? (locale === 'en' ? 'en' : 'ne')}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex min-h-9 items-center gap-1.5 border-b-2 border-brand px-1.5 text-caption font-bold text-brand-strong'
                      : 'inline-flex min-h-9 items-center gap-1.5 border-b-2 border-transparent px-1.5 text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-ink'
                  }
                >
                  {topic.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- tiny chip mark; next/image is overkill
                    <img
                      src={topic.imageUrl}
                      alt=""
                      width={18}
                      height={18}
                      className="h-[18px] w-[18px] rounded-full object-cover"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-brand text-[0.6rem] font-black text-paper"
                      aria-hidden="true"
                    >
                      {initial}
                    </span>
                  )}
                  {topic.label}
                </Link>
              </li>
            )
          })}
        </ul>
        {searchHref ? (
          <Link
            href={searchHref}
            className="hidden min-h-9 shrink-0 items-center gap-2 rounded-sm border border-rule bg-surface px-3 text-caption font-semibold text-mute transition-colors duration-fast ease-out-quint hover:border-ink-soft hover:text-ink sm:inline-flex"
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
