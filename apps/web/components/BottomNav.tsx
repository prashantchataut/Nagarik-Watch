'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'

/** Portal mobile IA: Home / Latest / Search / Calendar / Account. */
type BottomNavProps = {
  locale: Locale
  /** Logged-in profile or login path from PublicShell. */
  accountHref?: string
}

export function BottomNav({ locale, accountHref }: BottomNavProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const lang = locale === 'en' ? 'en' : 'ne'
  const resolvedAccountHref = accountHref ?? localizeHref(locale, '/auth/login')

  const items = [
    {
      key: 'home' as const,
      href: localizeHref(locale, '/'),
      match: (p: string) => p === '/' || p === '/en',
    },
    {
      key: 'latest' as const,
      href: localizeHref(locale, '/latest'),
      match: (p: string) => p.endsWith('/latest'),
    },
    {
      key: 'search' as const,
      href: localizeHref(locale, '/search'),
      match: (p: string) => p.includes('/search'),
    },
    {
      key: 'patro' as const,
      href: patroEntryHref(locale),
      match: (p: string) => p.includes('/patro') || p.includes('/utilities/calendar'),
    },
    {
      key: 'account' as const,
      href: resolvedAccountHref,
      match: (p: string) =>
        p.includes('/auth') ||
        p.endsWith('/saved') ||
        p.includes('/reader-corner') ||
        p.endsWith('/login') ||
        p.endsWith('/profile'),
    },
  ]

  const labels: Record<(typeof items)[number]['key'], string> = {
    home: dict.home,
    latest: dict.navLatest,
    search: dict.search,
    patro: locale === 'en' ? 'Calendar' : 'पात्रो',
    account: locale === 'en' ? 'Account' : 'खाता',
  }

  return (
    <nav
      aria-label={dict.bottomNavAria}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-page items-stretch justify-around">
        {items.map((item) => {
          const active = item.match(pathname)
          const className = `flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 text-[0.6875rem] transition-colors duration-fast ease-out-quint ${
            active
              ? 'font-bold text-brand-strong'
              : 'font-medium text-ink-soft hover:text-brand-strong'
          }`

          return (
            <li key={item.key} className="relative flex-1">
              {active ? (
                <span className="absolute inset-x-3 top-0 h-0.5 bg-brand" aria-hidden="true" />
              ) : null}
              <Link href={item.href} aria-current={active ? 'page' : undefined} className={className}>
                <Icon name={item.key} active={active} />
                <span lang={lang}>{labels[item.key]}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Kept for MobileNav / legacy listeners that open the sections drawer. */
export const NW_OPEN_MENU_EVENT = 'nw:open-menu'

function Icon({
  name,
  active,
}: {
  name: 'home' | 'latest' | 'search' | 'patro' | 'account'
  active: boolean
}) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: active ? 2.2 : 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-3v-6H8v6H5a2 2 0 0 1-2-2Z" />
        </svg>
      )
    case 'latest':
      return (
        <svg {...common}>
          <path d="M12 7v5l3 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      )
    case 'patro':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
          <path d="M8 3.5v3" />
          <path d="M16 3.5v3" />
          <path d="M3.5 10h17" />
        </svg>
      )
    case 'account':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      )
    default: {
      const _exhaustive: never = name
      void _exhaustive
      return null
    }
  }
}
