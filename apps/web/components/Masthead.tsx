'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, pathsMatch, swapLocale } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'
import { MobileNav } from '@/components/MobileNav'
import { ProvinceMegaMenu } from '@/components/ProvinceMegaMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { TopicsStrip, type TopicChip } from '@/components/TopicsStrip'
import type { AccountKind } from '@/lib/account-identity'
import { IconBookmark, IconCalendar, IconChart, IconSearch, IconUser } from '@/components/icons/PortalIcons'

type MastheadAccount = {
  kind: AccountKind
  displayName: string
  kindLabel: string
  roleLabel: string
  profileHref: string
}

type MastheadProps = {
  locale: Locale
  navCategories: Category[]
  topics?: TopicChip[]
  account?: MastheadAccount | null
  /** OnlineKhabar-style leaderboard beside the logo (desktop). */
  leaderboard?: ReactNode
}

const UTIL_LINK =
  'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-caption font-semibold text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const UTIL_ICON =
  'inline-flex h-9 w-9 items-center justify-center rounded-md text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export function Masthead({
  locale,
  navCategories,
  topics = [],
  account = null,
  leaderboard = null,
}: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const [condensed, setCondensed] = useState(false)
  const [dateLabel, setDateLabel] = useState('')
  const homeHref = localizeHref(locale, '/')
  const savedHref = localizeHref(locale, '/saved')
  const searchHref = localizeHref(locale, '/search')
  const patroHref = patroEntryHref(locale)
  const marketHref = localizeHref(locale, '/market')
  const latestHref = localizeHref(locale, '/latest')
  const toggleHref = swapLocale(pathname)
  const lang = locale === 'en' ? 'en' : 'ne'
  const accountHref = account?.profileHref ?? localizeHref(locale, '/auth/login')
  const accountLabel = account
    ? account.kind === 'reader'
      ? locale === 'en'
        ? 'My account'
        : 'मेरो खाता'
      : locale === 'en'
        ? 'Account'
        : 'खाता'
    : locale === 'en'
      ? 'Sign in'
      : 'लगइन'
  const accountTitle = account
    ? account.kind === 'reader'
      ? `${account.kindLabel} · ${account.roleLabel}`
      : locale === 'en'
        ? 'Staff account'
        : 'कर्मचारी खाता'
    : undefined
  const patroActive =
    pathname.includes('/patro') || pathname.includes('/utilities/calendar')
  const marketActive = pathname.includes('/market')

  useEffect(() => {
    setDateLabel(formatDate(new Date().toISOString(), locale))
  }, [locale])

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 56)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="nw-masthead sticky top-0 z-40"
      data-condensed={condensed ? 'true' : 'false'}
    >
      {/* Band 1 — Left logo + leaderboard (OnlineKhabar) + utilities */}
      <div className="nw-masthead__chrome border-b border-chrome-rule bg-chrome text-on-chrome">
        <div className="mx-auto flex max-w-page items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
          </div>

          <Link
            href={homeHref}
            className="nw-masthead__logo min-w-0 shrink rounded-md transition-opacity duration-fast ease-out-quint hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} tone="chrome" className="max-w-[11rem] sm:max-w-[15rem]" />
          </Link>

          {leaderboard ? (
            <div className="nw-masthead__leaderboard hidden min-w-0 flex-1 justify-center px-2 lg:flex">
              <div className="w-full max-w-[728px]">{leaderboard}</div>
            </div>
          ) : null}

          <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-0.5 sm:gap-1">
            <p
              className="nw-masthead__utility mr-1 hidden truncate text-caption font-semibold text-on-chrome-soft xl:block"
              lang={lang}
              suppressHydrationWarning
            >
              {dateLabel ? dict.mastheadDate(dateLabel) : '\u00a0'}
            </p>
            <Link
              href={accountHref}
              className={`${UTIL_LINK} hidden sm:inline-flex`}
              lang={lang}
              title={accountTitle}
            >
              <IconUser />
              <span className="max-w-[7rem] truncate">{accountLabel}</span>
            </Link>
            <Link
              href={savedHref}
              className={`${UTIL_ICON} hidden sm:inline-flex`}
              title={dict.navSaved}
              aria-label={dict.navSaved}
            >
              <IconBookmark />
            </Link>
            <Link
              href={searchHref}
              className={`${UTIL_ICON} hidden lg:inline-flex`}
              title={dict.search}
              aria-label={dict.search}
            >
              <IconSearch />
            </Link>
            <ThemeToggle
              locale={locale}
              className="!h-9 !w-9 !rounded-md !text-on-chrome-soft hover:!bg-brand-tint hover:!text-on-chrome"
            />
            <Link
              href={toggleHref}
              className="inline-flex h-9 min-w-[3.25rem] items-center justify-center rounded-md bg-brand px-2.5 text-meta font-black text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              lang={locale === 'en' ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {locale === 'en' ? 'ने' : 'EN'}
            </Link>
          </div>
        </div>
      </div>

      {/* Band 2 — Crimson category desk + utility CTAs */}
      <nav
        aria-label={dict.primaryNav}
        className="nw-masthead__primary border-b border-black/15 bg-brand-bar text-paper"
      >
        <div className="mx-auto flex max-w-page items-stretch gap-1 px-2 sm:gap-2 sm:px-4">
          <ul className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li>
              <NavLink href={homeHref} active={pathsMatch(pathname, homeHref)}>
                <HomeGlyph />
                <span className="sr-only sm:not-sr-only">{dict.home}</span>
              </NavLink>
            </li>
            {navCategories.map((c) => {
              const label = locale === 'en' && c.nameEn ? c.nameEn : c.nameNe
              const catLang = locale === 'en' && c.nameEn ? 'en' : 'ne'
              const href = localizeHref(locale, `/${c.slug}`)
              return (
                <li key={c.slug}>
                  <NavLink href={href} active={pathsMatch(pathname, href)} lang={catLang}>
                    {label}
                  </NavLink>
                </li>
              )
            })}
            <ProvinceMegaMenu locale={locale} />
            <li>
              <NavLink
                href={localizeHref(locale, '/fact-check')}
                active={pathname.includes('/fact-check')}
                lang={lang}
              >
                {locale === 'en' ? 'Fact check' : 'तथ्य-जाँच'}
              </NavLink>
            </li>
          </ul>

          <div className="hidden shrink-0 items-center gap-1.5 py-1 lg:flex">
            <Link
              href={patroHref}
              aria-current={patroActive ? 'page' : undefined}
              className={
                patroActive
                  ? 'inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-paper px-3 text-caption font-bold text-brand-bar'
                  : 'inline-flex min-h-9 items-center gap-1.5 rounded-sm bg-paper px-3 text-caption font-bold text-brand-bar transition-colors duration-fast ease-out-quint hover:bg-brand-tint active:scale-[0.98]'
              }
              lang={lang}
            >
              <IconCalendar className="h-4 w-4" />
              {locale === 'en' ? 'Calendar' : 'पात्रो'}
            </Link>
            <Link
              href={marketHref}
              aria-current={marketActive ? 'page' : undefined}
              className={
                marketActive
                  ? 'inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-paper/50 bg-paper/20 px-2.5 text-caption font-bold text-paper'
                  : 'inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-paper/35 bg-transparent px-2.5 text-caption font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-paper/15 active:scale-[0.98]'
              }
              lang={lang}
            >
              <IconChart className="h-4 w-4" />
              {locale === 'en' ? 'Market' : 'बजार'}
            </Link>
            <Link
              href={latestHref}
              className="inline-flex min-h-9 items-center rounded-sm bg-paper/15 px-2.5 text-caption font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-paper/25 active:scale-[0.98]"
              lang={lang}
            >
              {dict.navLatest}
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop only: trending tags. Hubs belong in drawer / bottom nav on mobile. */}
      {!condensed && topics.length > 0 ? (
        <div className="hidden md:block">
          <TopicsStrip locale={locale} topics={topics} searchHref={searchHref} />
        </div>
      ) : null}
    </header>
  )
}

function HomeGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10.5V20h10v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
          ? 'inline-flex min-h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm bg-brand-bar-active px-2.5 text-meta font-black text-paper sm:px-3 sm:text-body'
          : 'inline-flex min-h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-meta font-bold text-paper/90 transition-colors duration-fast ease-out-quint hover:bg-brand-bar-active/85 hover:text-paper sm:px-3 sm:text-body'
      }
    >
      {children}
    </Link>
  )
}
