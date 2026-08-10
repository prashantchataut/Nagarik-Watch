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
  const en = locale === 'en'
  if (!topics.length && !searchHref) return null

  return (
    <nav
      aria-label={en ? 'Trending topics' : 'ट्रेन्डिङ विषयहरू'}
      className="nw-masthead__topics border-b border-rule bg-surface/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-page items-center gap-2.5 px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2">
        {topics.length ? (
          <>
            <div className="flex shrink-0 items-center gap-1.5">
              <TrendingFlameIcon />
              <span
                className="font-display text-caption font-extrabold text-brand-strong"
                lang={en ? 'en' : 'ne'}
              >
                {en ? 'Trending' : 'ट्रेन्डिङ'}
              </span>
            </div>
            <span className="h-4 w-px shrink-0 bg-rule" aria-hidden="true" />
            <ul className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {topics.map((topic) => {
                const active = pathsMatch(pathname, topic.href)
                const cleanLabel = topic.label.replace(/^#/, '')
                return (
                  <li key={`${topic.href}-${topic.label}`} className="shrink-0">
                    <Link
                      href={topic.href}
                      lang={topic.lang ?? (en ? 'en' : 'ne')}
                      aria-current={active ? 'page' : undefined}
                      className={
                        active
                          ? 'inline-flex items-center rounded-full border border-brand bg-brand-tint px-2.5 py-0.5 text-caption font-bold text-brand-strong transition-all duration-fast ease-out-quint'
                          : 'inline-flex items-center rounded-full border border-rule bg-surface-raised/80 px-2.5 py-0.5 text-caption font-medium text-ink-soft transition-all duration-fast ease-out-quint hover:border-brand/70 hover:bg-brand-tint/60 hover:text-brand-strong active:scale-95'
                      }
                    >
                      <span className="text-brand-strong mr-0.5 opacity-80 font-bold">#</span>
                      {cleanLabel}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="min-w-0 flex-1 truncate text-caption text-mute" lang={en ? 'en' : 'ne'}>
            {en
              ? 'Trending topics appear as stories publish.'
              : 'ताजा समाचारसँगै मुख्य विषयहरू यहाँ देखिन्छन्।'}
          </p>
        )}
        {searchHref ? (
          <Link
            href={searchHref}
            className="hidden min-h-8 shrink-0 items-center gap-1.5 border-l border-rule pl-3 text-caption font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong lg:inline-flex"
            lang={en ? 'en' : 'ne'}
            aria-label={en ? 'Search' : 'खोज्नुहोस्'}
          >
            <IconSearch width={15} height={15} />
            <span>{en ? 'Search' : 'खोज'}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  )
}

function TrendingFlameIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-brand-strong shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2c-.5 2.5-2 4.5-4 6-2 1.5-3 3.5-3 6a7 7 0 0 0 14 0c0-3-1.5-5.5-4-7.5-1-1-1.5-2-2-4.5h-1Z" />
    </svg>
  )
}
