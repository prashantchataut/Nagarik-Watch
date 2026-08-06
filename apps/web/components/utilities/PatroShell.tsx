'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { isCalendarHostname, mainSiteHref } from '@/lib/calendar-host'

const PATRO_NAV = [
  { path: '/patro', ne: 'क्यालेन्डर', en: 'Calendar', match: ['/patro', '/utilities/calendar'] },
  { path: '/utilities/date-converter', ne: 'मिति रूपान्तरण', en: 'Date converter', match: ['/utilities/date-converter'] },
  { path: '/utilities/currency', ne: 'मुद्रा', en: 'Currency', match: ['/utilities/currency'] },
  { path: '/rashifal', ne: 'राशिफल', en: 'Horoscope', match: ['/rashifal'] },
  { path: '/utilities', ne: 'सबै उपकरण', en: 'All tools', match: ['/utilities'] },
] as const

export function PatroShell({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const pathname = usePathname() ?? ''
  const [onCalendarHost, setOnCalendarHost] = useState(false)

  useEffect(() => {
    setOnCalendarHost(isCalendarHostname(window.location.host))
  }, [])

  return (
    <div className="patro-shell mx-auto max-w-page px-3 pb-10 pt-3 sm:px-4 sm:pb-12 sm:pt-4">
      {onCalendarHost ? (
        <p className="patro-shell__back mb-2" lang={lang}>
          <Link href={mainSiteHref(locale, '/')}>
            {en ? '← Back to news' : '← समाचारमा फर्कनुहोस्'}
          </Link>
        </p>
      ) : null}
      <nav aria-label={en ? 'Calendar tools' : 'पात्रो उपकरण'} className="patro-tool-nav" lang={lang}>
        <ul>
          {PATRO_NAV.map((item) => {
            const href = localizeHref(locale, item.path)
            const active =
              item.path === '/utilities'
                ? /\/utilities\/?$/.test(pathname)
                : item.match.some((m) => pathname.includes(m))
            return (
              <li key={item.path}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={active ? 'is-active' : undefined}
                >
                  {en ? item.en : item.ne}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      {children}
    </div>
  )
}
