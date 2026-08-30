'use client'

import { Bookmark, CalendarDays, Home, LayoutGrid, Search } from 'lucide-react'
import { href, type Route } from '@/lib/news/router'
import { useSaved } from '@/lib/news/storage'
import { toDevanagari } from '@/lib/news/patro'

export default function BottomNav({ route }: { route: Route }) {
  const { saved } = useSaved()
  const items = [
    { href: '/', label: 'गृह', icon: Home, active: route.name === 'home' || route.name === 'english' },
    { href: '/#desks-anchor', label: 'विषय', icon: LayoutGrid, active: false },
    { href: '/search', label: 'खोज', icon: Search, active: route.name === 'search' },
    { href: '/patro', label: 'पात्रो', icon: CalendarDays, active: route.name === 'patro' },
    {
      href: '/saved',
      label: 'सेभ',
      icon: Bookmark,
      active: route.name === 'saved',
      badge: saved.length,
    },
  ]

  return (
    <nav
      aria-label="मुख्य नेभिगेसन (मोबाइल)"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface/97 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden no-print"
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href === '/#desks-anchor' ? '#desks-anchor' : href(item.href)}
            className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
              item.active ? 'text-crimson' : 'text-ink-soft hover:text-ink'
            }`}
            aria-current={item.active ? 'page' : undefined}
          >
            <span className="relative">
              <item.icon className="size-[22px]" strokeWidth={item.active ? 2.4 : 1.8} />
              {item.badge ? (
                <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-crimson px-1 font-headline text-[10px] font-bold leading-[16px] text-white">
                  {toDevanagari(item.badge)}
                </span>
              ) : null}
            </span>
            <span className="font-headline text-[11px] font-semibold leading-none">
              {item.label}
            </span>
            {item.active && (
              <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-sm bg-crimson" />
            )}
          </a>
        ))}
      </div>
    </nav>
  )
}
