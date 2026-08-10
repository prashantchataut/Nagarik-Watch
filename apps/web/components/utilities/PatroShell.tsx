'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { mainSiteHref } from '@/lib/calendar-host'
import { getDictionary } from '@/lib/i18n/dictionaries'
import Link from 'next/link'

/** Utility primary nav for the पात्रो product (Ratopati/OK calendar IA). */
export const PATRO_NAV = [
  {
    path: '/patro',
    ne: 'क्यालेन्डर',
    en: 'Calendar',
    match: ['/patro', '/utilities/calendar'],
  },
  {
    path: '/patro#holidays',
    ne: 'बिदा',
    en: 'Holidays',
    match: ['#holidays'],
    hashOnly: true as const,
  },
  {
    path: '/utilities/date-converter',
    ne: 'मिति',
    en: 'Date',
    match: ['/utilities/date-converter'],
  },
  {
    path: '/utilities/currency',
    ne: 'विनिमय',
    en: 'Forex',
    match: ['/utilities/currency'],
  },
  {
    path: '/market',
    ne: 'सुन / सेयर',
    en: 'Gold / shares',
    match: ['/market'],
  },
  {
    path: '/rashifal',
    ne: 'राशिफल',
    en: 'Horoscope',
    match: ['/rashifal'],
  },
  {
    path: '/utilities',
    ne: 'उपकरण',
    en: 'Tools',
    match: ['/utilities'],
  },
] as const

/**
 * Subdomain chrome: brand lockup, समाचार CTA, utility primary nav.
 * `standalone` = full product header (calendar host). `embedded` = tool nav only (apex).
 */
export function PatroShell({
  locale,
  children,
  mode = 'embedded',
}: {
  locale: Locale
  children: ReactNode
  mode?: 'standalone' | 'embedded'
}) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? ''
  const newsHref = mainSiteHref(locale, '/')
  const homeHref = localizeHref(locale, '/patro')
  const otherLocale = locale === 'en' ? 'ne' : 'en'
  const toggleHref =
    locale === 'en'
      ? pathname.replace(/^\/en/, '') || '/'
      : `/en${pathname === '/' ? '' : pathname}`

  if (mode === 'standalone') {
    return (
      <div className="patro-chrome">
        <header className="patro-chrome__header">
          <div className="patro-chrome__band">
            <Link
              href={homeHref}
              className="patro-chrome__brand"
              aria-label={en ? `${dict.siteName} calendar` : `${dict.siteName} पात्रो`}
            >
              <Logo
                siteName={dict.siteName}
                tone="default"
                className="max-w-[10rem] sm:max-w-[13rem]"
              />
              <span className="patro-chrome__product" lang={lang}>
                {en ? 'Patro' : 'पात्रो'}
              </span>
            </Link>

            <div className="patro-chrome__actions">
              <ThemeToggle locale={locale} className="!h-9 !w-9 !rounded-md" />
              <Link
                href={toggleHref}
                className="inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-sm border border-rule px-2.5 text-meta font-black text-ink transition-colors hover:border-brand hover:text-brand-strong"
                lang={otherLocale}
                aria-label={dict.localeToggleAria}
              >
                {locale === 'en' ? 'ने' : 'EN'}
              </Link>
              <Link href={newsHref} className="patro-chrome__news-cta" lang={lang}>
                {en ? 'News' : 'समाचार'}
              </Link>
            </div>
          </div>
          <div className="patro-chrome__nav-wrap">
            <PatroToolNav locale={locale} pathname={pathname} />
          </div>
        </header>

        <main id="main" className="patro-chrome__main mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
          {children}
        </main>

        <footer className="patro-chrome__footer">
          <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-2 px-3 py-4 sm:px-4">
            <p className="text-caption text-mute" lang={lang}>
              {en
                ? `${dict.siteName} calendar: festivals, rates and date tools.`
                : `${dict.siteName} पात्रो: पर्व, दर र मिति उपकरण।`}
            </p>
            <Link
              href={newsHref}
              className="text-caption font-bold text-brand-strong hover:underline"
              lang={lang}
            >
              {en ? 'Back to news' : 'समाचारमा फर्कनुहोस्'}
            </Link>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="patro-shell mx-auto max-w-page px-3 pb-10 pt-3 sm:px-4 sm:pb-12 sm:pt-4">
      <PatroToolNav locale={locale} pathname={pathname} />
      {children}
    </div>
  )
}

function PatroToolNav({ locale, pathname }: { locale: Locale; pathname: string }) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <nav aria-label={en ? 'Calendar tools' : 'पात्रो उपकरण'} className="patro-tool-nav" lang={lang}>
      <ul>
        {PATRO_NAV.map((item) => {
          const basePath = item.path.split('#')[0] ?? item.path
          const href =
            'hashOnly' in item && item.hashOnly
              ? `${localizeHref(locale, '/patro')}#holidays`
              : localizeHref(locale, basePath)
          const active = isNavActive(pathname, item)
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
  )
}

function isNavActive(pathname: string, item: (typeof PATRO_NAV)[number]): boolean {
  if ('hashOnly' in item && item.hashOnly) return false
  if (item.path === '/utilities') return /\/utilities\/?$/.test(pathname)
  if (item.path === '/patro') {
    return (
      pathname === '/patro' || pathname.endsWith('/patro') || pathname === '/' || pathname === '/en'
    )
  }
  return item.match.some((m) => !m.startsWith('#') && pathname.includes(m))
}
