'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, pathsMatch, swapLocale } from '@/lib/i18n/locales'
import { MobileNav } from '@/components/MobileNav'
import { ProvinceMegaMenu } from '@/components/ProvinceMegaMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { TopicsStrip, type TopicChip } from '@/components/TopicsStrip'
import type { AccountKind } from '@/lib/account-identity'
import {
  IconBookmark,
  IconCalendar,
  IconChart,
  IconSearch,
  IconUser,
} from '@/components/icons/PortalIcons'
import { patroEntryHref } from '@/lib/calendar-host'

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
  'inline-flex min-h-8 items-center gap-1.5 rounded border border-transparent px-2 text-caption font-semibold text-on-chrome-soft transition-all duration-fast ease-out-quint hover:border-chrome-rule hover:bg-surface-raised/70 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const UTIL_ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded border border-transparent text-on-chrome-soft transition-all duration-fast ease-out-quint hover:border-chrome-rule hover:bg-surface-raised/70 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

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
  const [englishDateLabel, setEnglishDateLabel] = useState('')
  const homeHref = localizeHref(locale, '/')
  const savedHref = localizeHref(locale, '/saved')
  const searchHref = localizeHref(locale, '/search')
  const latestHref = localizeHref(locale, '/latest')
  const patroHref = patroEntryHref(locale)
  const marketHref = localizeHref(locale, '/market')
  const unicodeHref = localizeHref(locale, '/preeti-unicode')
  const toggleHref = swapLocale(pathname)
  const lang = locale === 'en' ? 'en' : 'ne'
  const isEn = locale === 'en'

  const accountHref = account?.profileHref ?? localizeHref(locale, '/auth/login')
  const accountLabel = account
    ? account.kind === 'reader'
      ? isEn
        ? 'My account'
        : 'मेरो खाता'
      : isEn
        ? 'Account'
        : 'खाता'
    : isEn
      ? 'Sign in'
      : 'लगइन'
  const accountTitle = account
    ? account.kind === 'reader'
      ? `${account.kindLabel} · ${account.roleLabel}`
      : isEn
        ? 'Staff account'
        : 'कर्मचारी खाता'
    : undefined

  useEffect(() => {
    const now = new Date()
    setDateLabel(formatDate(now.toISOString(), locale))
    setEnglishDateLabel(
      now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    )
  }, [locale])

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 56)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="nw-masthead sticky top-0 z-40" data-condensed={condensed ? 'true' : 'false'}>
      {/* Band 1: Publication Identity, Leaderboard and Global Utilities */}
      <div className="nw-masthead__chrome border-b border-chrome-rule bg-chrome text-on-chrome shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          {/* Mobile Header: Hamburger + Centered Logo + Quick Actions */}
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
          </div>

          <div className="flex min-w-0 items-center gap-4">
            <Link
              href={homeHref}
              className="nw-masthead__logo min-w-0 shrink transition-opacity duration-fast ease-out-quint hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={dict.siteName}
            >
              <Logo
                siteName={dict.siteName}
                tone="chrome"
                className="max-w-[11.5rem] sm:max-w-[15rem]"
              />
            </Link>

            {/* Desktop Date Box (BS + AD) */}
            <div className="hidden xl:flex flex-col border-l border-chrome-rule pl-3.5 leading-tight">
              <span
                className="text-caption font-bold text-on-chrome"
                lang={lang}
                suppressHydrationWarning
              >
                {dateLabel || '\u00a0'}
              </span>
              <span
                className="text-[0.68rem] font-medium text-on-chrome-soft"
                lang="en"
                suppressHydrationWarning
              >
                {englishDateLabel || '\u00a0'}
              </span>
            </div>
          </div>

          {/* Desktop Leaderboard Space */}
          {leaderboard ? (
            <div className="nw-masthead__leaderboard hidden min-w-0 flex-1 justify-center px-2 lg:flex">
              <div className="w-full max-w-[728px]">{leaderboard}</div>
            </div>
          ) : null}

          {/* Utility Tools & User Actions */}
          <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-1.5">
            {/* Quick Tools Links (Desktop) */}
            <Link
              href={unicodeHref}
              className={`${UTIL_LINK} hidden md:inline-flex`}
              lang={lang}
              title={isEn ? 'Preeti to Unicode Converter' : 'प्रिती युनिकोड रूपान्तरण'}
            >
              <span className="text-[0.72rem] font-bold">युनिकोड</span>
            </Link>

            <Link
              href={savedHref}
              className={`${UTIL_ICON_BTN} hidden sm:inline-flex`}
              title={dict.navSaved}
              aria-label={dict.navSaved}
            >
              <IconBookmark width={16} height={16} />
            </Link>

            <Link
              href={accountHref}
              className={`${UTIL_LINK} hidden sm:inline-flex`}
              lang={lang}
              title={accountTitle}
            >
              <IconUser width={16} height={16} />
              <span className="max-w-[6.5rem] truncate text-caption">{accountLabel}</span>
            </Link>

            <Link
              href={searchHref}
              className={UTIL_ICON_BTN}
              title={dict.search}
              aria-label={dict.search}
            >
              <IconSearch width={16} height={16} />
            </Link>

            <ThemeToggle
              locale={locale}
              className="!h-8 !w-8 !rounded !text-on-chrome-soft hover:!bg-surface-raised hover:!text-on-chrome"
            />

            <Link
              href={toggleHref}
              className="inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded border border-chrome-rule bg-surface-raised/80 px-2 text-caption font-extrabold text-on-chrome transition-all duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              lang={isEn ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {isEn ? 'नेपाली' : 'EN'}
            </Link>
          </div>
        </div>
      </div>

      {/* Band 2: Primary Newsroom Navigation Bar (Civic Crimson) */}
      <nav
        aria-label={dict.primaryNav}
        className="nw-masthead__primary border-b border-black/15 bg-brand-bar text-paper shadow-sm"
      >
        <div className="mx-auto flex max-w-page items-stretch justify-between gap-1 px-2 sm:gap-2 sm:px-4">
          <ul className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li>
              <NavLink href={homeHref} active={pathsMatch(pathname, homeHref)}>
                <HomeGlyph />
                <span className="sr-only sm:not-sr-only">{dict.home}</span>
              </NavLink>
            </li>
            <li>
              <NavLink href={latestHref} active={pathsMatch(pathname, latestHref)} lang={lang}>
                {dict.navLatest}
              </NavLink>
            </li>
            {navCategories.map((c) => {
              const label = isEn && c.nameEn ? c.nameEn : c.nameNe
              const catLang = isEn && c.nameEn ? 'en' : 'ne'
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
                {isEn ? 'Fact check' : 'तथ्य-जाँच'}
              </NavLink>
            </li>
          </ul>

          {/* Prominent High-Utility CTAs (OnlineKhabar/Ratopati Style) */}
          <div className="hidden md:flex shrink-0 items-center gap-1.5 pl-2">
            <Link
              href={patroHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-gold px-3 text-caption font-extrabold text-ink shadow-sm transition-all duration-fast ease-out-quint hover:brightness-105 active:scale-95"
              lang={lang}
              title={isEn ? 'Bikram Sambat Nepali Calendar' : 'नेपाली क्यालेन्डर र पात्रो'}
            >
              <IconCalendar width={14} height={14} className="text-ink" />
              <span>{isEn ? 'Calendar' : 'पात्रो'}</span>
            </Link>

            <Link
              href={marketHref}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-paper/30 bg-brand-bar-active/70 px-2.5 text-caption font-bold text-paper transition-all duration-fast ease-out-quint hover:border-paper/80 hover:bg-brand-bar-active"
              lang={lang}
              title={isEn ? 'Markets & NEPSE' : 'सेयर बजार र सुन चाँदी'}
            >
              <IconChart width={14} height={14} />
              <span>{isEn ? 'Markets' : 'बजार'}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Band 3: Trending Topics (#hashtags) Strip */}
      {!condensed && topics.length > 0 ? (
        <TopicsStrip locale={locale} topics={topics} searchHref={searchHref} />
      ) : null}
    </header>
  )
}

function HomeGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
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
          ? 'inline-flex min-h-11 cursor-pointer items-center gap-1 whitespace-nowrap border-b-2 border-paper bg-brand-bar-active px-2.5 text-caption font-black text-paper sm:px-3 sm:text-body'
          : 'inline-flex min-h-11 cursor-pointer items-center gap-1 whitespace-nowrap border-b-2 border-transparent px-2.5 text-caption font-bold text-paper/90 transition-colors duration-fast ease-out-quint hover:border-paper/70 hover:bg-brand-bar-active/65 hover:text-paper sm:px-3 sm:text-body'
      }
    >
      {children}
    </Link>
  )
}
