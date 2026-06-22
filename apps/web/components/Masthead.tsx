'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, swapLocale } from '@/lib/i18n/locales'
import { MobileNav } from '@/components/MobileNav'
import { SecondaryNav } from '@/components/SecondaryNav'
import { ProvinceMegaMenu } from '@/components/ProvinceMegaMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { STATIC_HUBS } from '@/lib/site'

type MastheadProps = {
  locale: Locale
  navCategories: Category[]
}

// 44×44px is the WCAG 2.5.5 minimum touch target. Every icon button in the chrome uses it.
const ICON_BTN =
  'inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong'

/**
 * Site chrome top — three tiers, modelled on national-grade news portals:
 *   1. SecondaryNav (utility rail: market, sports, election, …) — desktop only.
 *   2. Brand row: logo, BS/AD date, search, theme, locale toggle, mobile menu.
 *   3. Primary section nav: categories + the province mega-menu + key hubs.
 *
 * Client component so the locale toggle can swap locale in place, the
 * ProvinceMegaMenu can manage disclosure state, and the SecondaryNav can read
 * the pathname for the active affordance.
 */
export function Masthead({ locale, navCategories }: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'

  const today = new Date().toISOString()
  const dateLabel = formatDate(today, locale)

  const homeHref = localizeHref(locale, '/')
  const searchHref = localizeHref(locale, '/search')
  // The toggle points at the equivalent page in the other locale, not the home page.
  const toggleHref = swapLocale(pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <SecondaryNav locale={locale} />

      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={homeHref}
            className="rounded-md transition-opacity duration-fast ease-out-quint hover:opacity-90 focus-visible:opacity-90"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <span
              className="mr-2 hidden text-meta text-ink-soft md:inline"
              lang={locale === 'en' ? 'en' : 'ne'}
            >
              {dict.mastheadDate(dateLabel)}
            </span>
            <Link href={searchHref} className={ICON_BTN} aria-label={dict.search}>
              <SearchIcon />
            </Link>
            <ThemeToggle locale={locale} />
            <Link
              href={toggleHref}
              className="inline-flex h-9 items-center rounded-full border border-rule px-3.5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
              lang={locale === 'en' ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {dict.localeToggleTo}
            </Link>
            <MobileNav locale={locale} navCategories={navCategories} />
          </div>
        </div>

        <nav aria-label={dict.primaryNav} className="hidden border-t border-rule pt-2 md:block">
          <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
            <li>
              <NavLink href={homeHref} active={pathname === '/' || pathname === '/en'}>
                {dict.home}
              </NavLink>
            </li>
            {navCategories.map((c) => {
              const label = locale === 'en' && c.nameEn ? c.nameEn : c.nameNe
              const catLang = locale === 'en' && c.nameEn ? 'en' : 'ne'
              const href = localizeHref(locale, `/${c.slug}`)
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={c.slug}>
                  <NavLink href={href} active={active} lang={catLang}>
                    {label}
                  </NavLink>
                </li>
              )
            })}
            <ProvinceMegaMenu locale={locale} />
            {STATIC_HUBS.filter((hub) =>
              ['latest', 'trending', 'fact-check'].includes(hub.key),
            ).map((hub) => {
              const href = localizeHref(locale, hub.path)
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={hub.key}>
                  <NavLink href={href} active={active} lang={locale === 'en' ? 'en' : 'ne'}>
                    {locale === 'en' ? hub.titleEn : hub.titleNe}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}

/** Primary-nav item. The current section gets a brand-tint pill (rounded-full), the rest
    are padded text links that fill to the pill on hover, so the active state reads as the
    same affordance in its "on" state rather than a different component. */
function NavLink({
  href,
  active,
  lang,
  children,
}: {
  href: string
  active?: boolean
  lang?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      lang={lang}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'inline-block rounded-full bg-brand-tint px-3.5 py-1.5 text-body font-semibold text-brand-strong'
          : 'inline-block rounded-full px-3.5 py-1.5 text-body font-medium text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint/60 hover:text-brand-strong'
      }
    >
      {children}
    </Link>
  )
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
