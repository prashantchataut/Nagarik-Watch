'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

/**
 * BottomNav — a mobile-only fixed bottom bar (spec Phase 3: optional bottom nav with
 * Home / Latest / Search / Trending / Saved). It is the one-tap reach for the actions a
 * reader repeats every session, so search and the feeds are never buried.
 *
 * Why a bottom bar, on mobile only: thumbs reach the bottom of a phone, not the top
 * masthead; on `lg+` the desktop header already carries these, so it hides (`lg:hidden`).
 *
 * Accessibility: it is a real <nav> of real links with 56px-tall targets (well above the
 * 44px WCAG 2.5.5 minimum), visible labels (no icon-only guessing), aria-current on the
 * active item, and a focus-visible ring from the global token. The layout reserves
 * bottom padding on <main> so this bar never covers content.
 *
 * Routing note: "Latest"/"Trending" do not have dedicated pages yet (the backend agent owns
 * those feeds). Until they exist they resolve to the search view with an honest query, so
 * the link always lands somewhere real rather than a 404. "Saved" points at the bookmarks
 * placeholder page. TODO(integration): repoint Latest/Trending to their real routes once the
 * feeds ship, and Saved to the real account/bookmarks surface.
 */
const ITEMS = [
  { key: 'home', href: '/', match: (p: string) => p === '/' || p === '/en' },
  { key: 'latest', href: '/latest', match: (p: string) => p.endsWith('/latest') },
  { key: 'search', href: '/search', match: (p: string) => p.includes('/search') },
  { key: 'trending', href: '/trending', match: (p: string) => p.endsWith('/trending') },
  { key: 'saved', href: '/saved', match: (p: string) => p.endsWith('/saved') },
] as const

export function BottomNav({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const lang = locale === 'en' ? 'en' : 'ne'

  const labels: Record<(typeof ITEMS)[number]['key'], string> = {
    home: dict.home,
    latest: dict.navLatest,
    search: dict.search,
    trending: dict.navTrending,
    saved: dict.navSaved,
  }

  return (
    <nav
      aria-label={dict.bottomNavAria}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:hidden"
    >
      <ul className="mx-auto flex max-w-page items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = item.match(pathname)
          return (
            <li key={item.key} className="relative flex-1">
              {/* Active top indicator — a 2px brand bar that marks the current tab. */}
              {active && (
                <span className="absolute inset-x-3 top-0 h-0.5 bg-brand" aria-hidden="true" />
              )}
              <Link
                href={localizeHref(locale, item.href)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-medium transition-colors duration-fast ease-out-quint ${
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
    case 'trending':
      return (
        <svg {...common}>
          <path d="m3 17 6-6 4 4 8-8" />
          <path d="M17 7h4v4" />
        </svg>
      )
    case 'saved':
      return (
        <svg {...common}>
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
        </svg>
      )
    default:
      return null
  }
}
