'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { pathsMatch } from '@/lib/i18n/locales'

export type TopicLink = {
  href: string
  label: string
  lang?: string
  imageUrl?: string
}

export function TopicsLinks({ locale, topics }: { locale: Locale; topics: TopicLink[] }) {
  const pathname = usePathname() ?? '/'
  const en = locale === 'en'
  if (!topics.length) return null

  return (
    <nav
      aria-label={en ? 'Trending topics' : 'ट्रेन्डिङ विषयहरू'}
      className="nw-masthead__topics hidden border-b border-rule bg-surface lg:block"
    >
      <div className="mx-auto flex min-h-9 max-w-page items-center gap-3 px-4">
        <span className="shrink-0 font-display text-caption font-extrabold text-brand-strong" lang={en ? 'en' : 'ne'}>
          {en ? 'Trending' : 'ट्रेन्डिङ'}
        </span>
        <ul className="flex min-w-0 flex-1 items-center overflow-hidden text-caption text-ink-soft">
          {topics.slice(0, 10).map((topic, index) => {
            const active = pathsMatch(pathname, topic.href)
            return (
              <li
                key={`${topic.href}-${topic.label}`}
                className={index === 0 ? 'min-w-0 shrink' : 'min-w-0 shrink border-l border-rule pl-3 ml-3'}
              >
                <Link
                  href={topic.href}
                  lang={topic.lang ?? (en ? 'en' : 'ne')}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'block truncate font-extrabold text-brand-strong underline decoration-brand underline-offset-4'
                      : 'block truncate font-semibold transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
                  }
                >
                  {topic.label.replace(/^#/, '')}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
