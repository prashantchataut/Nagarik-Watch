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
  imageUrl?: string
}

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
      <div className="mx-auto flex max-w-page items-center gap-3 px-3 py-2 sm:px-4">
        {topics.length ? (
          <>
            <span
              className="shrink-0 font-display text-caption font-extrabold text-brand-strong"
              lang={locale === 'en' ? 'en' : 'ne'}
            >
              {locale === 'en' ? 'Trending' : 'चर्चामा'}
            </span>
            <span className="h-4 w-px shrink-0 bg-rule" aria-hidden="true" />
            <ul className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {topics.map((topic, index) => {
                const active = pathsMatch(pathname, topic.href)
                return (
                  <li
                    key={`${topic.href}-${topic.label}`}
                    className="flex shrink-0 items-center"
                  >
                    {index > 0 ? (
                      <span className="mx-2.5 text-rule-strong" aria-hidden="true">
                        •
                      </span>
                    ) : null}
                    <Link
                      href={topic.href}
                      lang={topic.lang ?? (locale === 'en' ? 'en' : 'ne')}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'py-1 text-caption font-bold text-brand-strong underline decoration-brand/50 underline-offset-4'
                          : 'py-1 text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong'
                      }
                    >
                      {topic.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
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
            className="hidden min-h-8 shrink-0 items-center gap-1.5 border-l border-rule pl-3 text-caption font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:inline-flex"
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
