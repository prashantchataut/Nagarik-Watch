'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { STATIC_HUBS, SECONDARY_NAV_HUBS } from '@/lib/site'

/**
 * SecondaryNav — the slim utility rail above the section nav (eKantipur /
 * OnlineKhabar pattern). Surfaces market, sports, election, disaster alerts,
 * video, photos and reader-corner as scannable inline links. Hidden on mobile
 * (the MobileNav drawer carries them there) so the desktop chrome stays dense
 * without crowding the small screen.
 */
export function SecondaryNav({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '/'
  const hubs = SECONDARY_NAV_HUBS.map((key) => STATIC_HUBS.find((h) => h.key === key)).filter(
    (h): h is (typeof STATIC_HUBS)[number] => Boolean(h),
  )

  return (
    <nav
      aria-label={locale === 'en' ? 'Sections' : 'विभाग'}
      className="hidden border-b border-rule bg-surface-raised md:block"
    >
      <ul className="mx-auto flex max-w-page items-center gap-1 overflow-x-auto px-4 py-1.5 text-meta">
        {hubs.map((hub) => {
          const href = localizeHref(locale, hub.path)
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={hub.key}>
              <Link
                href={href}
                lang={locale === 'en' ? 'en' : 'ne'}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'whitespace-nowrap rounded-full bg-brand-tint px-2.5 py-1 font-semibold text-brand-strong'
                    : 'whitespace-nowrap rounded-full px-2.5 py-1 font-medium text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint/60 hover:text-brand-strong'
                }
              >
                {locale === 'en' ? hub.titleEn : hub.titleNe}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
