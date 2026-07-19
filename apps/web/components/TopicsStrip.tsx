'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'

export type TopicChip = {
  href: string
  label: string
  lang?: string
}

/** Ratopati-style topics rail under primary nav. Chips only live here — not in primary. */
export function TopicsStrip({ locale, topics }: { locale: Locale; topics: TopicChip[] }) {
  const pathname = usePathname() ?? '/'
  if (!topics.length) return null

  return (
    <nav
      aria-label={locale === 'en' ? 'Topics' : 'विषय'}
      className="nw-masthead__topics border-b border-rule bg-surface-raised"
    >
      <ul className="mx-auto flex max-w-page items-center gap-2 overflow-x-auto px-3 py-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((topic) => {
          const active = pathname === topic.href || pathname.startsWith(`${topic.href}/`)
          return (
            <li key={`${topic.href}-${topic.label}`} className="shrink-0">
              <Link
                href={topic.href}
                lang={topic.lang ?? (locale === 'en' ? 'en' : 'ne')}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'inline-flex min-h-8 items-center whitespace-nowrap rounded-md border border-brand bg-brand px-2.5 text-caption font-bold text-surface'
                    : 'inline-flex min-h-8 items-center whitespace-nowrap rounded-md border border-rule bg-surface px-2.5 text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong'
                }
              >
                {topic.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
