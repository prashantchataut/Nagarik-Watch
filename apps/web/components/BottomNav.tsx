'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

/** BBC-style primary mobile IA: Home / Latest / Search / Sections / Account. */
const ITEMS = [
  { key: 'home', href: '/', match: (p: string) => p === '/' || p === '/en' },
  { key: 'latest', href: '/latest', match: (p: string) => p.endsWith('/latest') },
  { key: 'search', href: '/search', match: (p: string) => p.includes('/search') },
  {
    key: 'sections',
    href: '/#desks',
    match: (p: string) => {
      const parts = p.split('/').filter(Boolean)
      const offset = parts[0] === 'en' ? 1 : 0
      const seg = parts[offset]
      if (!seg) return false
      const reserved = new Set([
        'latest',
        'search',
        'trending',
        'auth',
        'saved',
        'reader-corner',
        'admin',
        'journalist',
        'membership',
        'about',
        'contact',
        'login',
        'register',
        'profile',
        'utilities',
        'market',
        'most-read',
      ])
      return !reserved.has(seg)
    },
  },
  {
    key: 'account',
    href: '/auth/profile',
    match: (p: string) =>
      p.includes('/auth') ||
      p.endsWith('/saved') ||
      p.includes('/reader-corner') ||
      p.endsWith('/login') ||
      p.endsWith('/profile'),
  },
] as const

export function BottomNav({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const lang = locale === 'en' ? 'en' : 'ne'

  const labels: Record<(typeof ITEMS)[number]['key'], string> = {
    home: dict.home,
    latest: dict.navLatest,
    search: dict.search,
    sections: locale === 'en' ? 'Sections' : 'विभाग',
    account: locale === 'en' ? 'Account' : 'खाता',
  }

  return (
    <nav
      aria-label={dict.bottomNavAria}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-page items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = item.match(pathname)
          const href = localizeHref(locale, item.href)
          return (
            <li key={item.key} className="relative flex-1">
              {active ? (
                <span className="absolute inset-x-3 top-0 h-0.5 bg-brand" aria-hidden="true" />
              ) : null}
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors duration-fast ease-out-quint ${
                  active ? 'text-brand-strong' : 'text-ink-soft hover:text-brand-strong'
                }`}
              >
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

function Icon({ name, active }: { name: string; active: boolean }) {
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
    case 'sections':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h10" />
        </svg>
      )
    case 'account':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      )
    default:
      return null
  }
}
