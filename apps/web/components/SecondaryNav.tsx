'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { STATIC_HUBS, SECONDARY_NAV_HUBS } from '@/lib/site'

export function SecondaryNav({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '/'
  const hubs = SECONDARY_NAV_HUBS.map((key) => STATIC_HUBS.find((h) => h.key === key)).filter(
    (h): h is (typeof STATIC_HUBS)[number] => Boolean(h),
  )

  return (
    <nav
      aria-label={locale === 'en' ? 'Service sections' : 'सेवा विभाग'}
      className="hidden border-b border-rule bg-surface-raised md:block"
    >
      <ul className="mx-auto flex max-w-page items-center divide-x divide-rule overflow-x-auto px-4 text-meta [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    ? 'block whitespace-nowrap bg-brand-tint px-3 py-2 font-bold text-brand-strong'
                    : 'block whitespace-nowrap px-3 py-2 font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-surface hover:text-ink'
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
