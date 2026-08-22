'use client'

import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { useStablePathname } from '@/lib/i18n/use-stable-pathname'
import { patroEntryHref } from '@/lib/calendar-host'
import {
  IconCalendar,
  IconClock,
  IconHome,
  IconSearch,
  IconUser,
} from '@/components/icons/PortalIcons'

type BottomNavProps = {
  locale: Locale
  accountHref?: string
}

type BottomNavKey = 'home' | 'latest' | 'patro' | 'search' | 'account'

export function BottomNav({ locale, accountHref }: BottomNavProps) {
  const dict = getDictionary(locale)
  const pathname = useStablePathname()
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'
  const resolvedAccountHref = accountHref ?? localizeHref(locale, '/auth/login')

  const items: Array<{
    key: BottomNavKey
    href: string
    match: (path: string) => boolean
  }> = [
    {
      key: 'home',
      href: localizeHref(locale, '/'),
      match: (path) => path === '/' || path === '/en',
    },
    {
      key: 'latest',
      href: localizeHref(locale, '/latest'),
      match: (path) => path.endsWith('/latest'),
    },
    {
      key: 'patro',
      href: patroEntryHref(locale),
      match: (path) => path.includes('/patro') || path.includes('/utilities/calendar'),
    },
    {
      key: 'search',
      href: localizeHref(locale, '/search'),
      match: (path) => path.endsWith('/search'),
    },
    {
      key: 'account',
      href: resolvedAccountHref,
      match: (path) =>
        path.includes('/auth') || path.includes('/reader-corner') || path.endsWith('/profile'),
    },
  ]

  const labels: Record<BottomNavKey, string> = {
    home: dict.home,
    latest: en ? 'Latest' : 'ताजा',
    patro: en ? 'Patro' : 'पात्रो',
    search: en ? 'Search' : 'खोज',
    account: en ? 'Account' : 'खाता',
  }

  return (
    <nav
      aria-label={dict.bottomNavAria}
      className="nw-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex h-14 max-w-page items-stretch">
        {items.map((item) => {
          const active = item.match(pathname)
          return (
            <li key={item.key} className="relative flex-1">
              {active ? (
                <span className="absolute inset-x-3 top-0 h-0.5 bg-brand-strong" aria-hidden="true" />
              ) : null}
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[0.6875rem] transition-colors duration-fast ease-out-quint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand ${
                  active
                    ? 'font-extrabold text-brand-strong'
                    : 'font-semibold text-ink-soft hover:text-brand-strong'
                }`}
              >
                <BottomIcon name={item.key} active={active} />
                <span lang={lang} className="max-w-full truncate">
                  {labels[item.key]}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function BottomIcon({ name, active }: { name: BottomNavKey; active: boolean }) {
  const props = { width: 20, height: 20, strokeWidth: active ? 2.25 : 1.85 }

  switch (name) {
    case 'home':
      return <IconHome {...props} />
    case 'latest':
      return <IconClock {...props} />
    case 'patro':
      return <IconCalendar {...props} />
    case 'search':
      return <IconSearch {...props} />
    case 'account':
      return <IconUser {...props} />
    default: {
      const exhaustive: never = name
      void exhaustive
      return null
    }
  }
}
