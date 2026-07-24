'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'

export type TopicChip = {
  href: string
  label: string
  lang?: string
}

/** Dense newspaper topics rail — text links with rules, not rounded chips. */
export function TopicsStrip({ locale, topics }: { locale: Locale; topics: TopicChip[] }) {
  const pathname = usePathname() ?? '/'
  if (!topics.length) return null

  return (
    <nav
      aria-label={locale === 'en' ? 'Topics' : 'विषय'}
      className="nw-masthead__topics border-b border-rule bg-surface"
    >
      <ul className="mx-auto flex max-w-page items-center gap-0 overflow-x-auto px-3 py-1.5 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((topic, index) => {
          const active = pathname === topic.href || pathname.startsWith(`${topic.href}/`)
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
    </nav>
  )
}
