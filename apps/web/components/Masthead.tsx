'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, pathsMatch, swapLocale } from '@/lib/i18n/locales'
import { useStablePathname } from '@/lib/i18n/use-stable-pathname'
import { MobileNav } from '@/components/MobileNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { TopicsLinks, type TopicLink } from '@/components/TopicsLinks'
import { SearchLauncher } from '@/components/search/SearchLauncher'
import type { AccountKind } from '@/lib/account-identity'
import { IconBookmark, IconCalendar, IconUser } from '@/components/icons/PortalIcons'
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
  topics?: TopicLink[]
  account?: MastheadAccount | null
  leaderboard?: ReactNode
  /** Live reference (weather, markets) rendered in the compact utility line. */
  reference?: ReactNode
}

const PRIMARY_NAV_SLOTS = 8

const utilityLink =
  'inline-flex min-h-9 items-center gap-1.5 px-2 text-caption font-semibold text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:bg-surface-raised/60 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

function navLinkClass(active: boolean) {
  return active
    ? 'inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-[3px] border-paper bg-brand-bar-active px-3 text-caption font-black text-paper sm:text-body'
    : 'inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap border-b-[3px] border-transparent px-3 text-caption font-bold text-paper/90 transition-colors duration-fast ease-out-quint hover:bg-brand-bar-active/55 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-paper sm:text-body'
}

/**
 * Public chrome follows one simple hierarchy:
 * utility facts -> publication identity/ad -> primary desks -> live topics.
 * The old multi-band sticky stack made the first story fight the header; only
 * the desk rail is sticky now, so navigation stays reachable without consuming
 * the whole mobile viewport.
 */
export function Masthead({
  locale,
  navCategories,
  topics = [],
  account = null,
  leaderboard = null,
  reference = null,
}: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = useStablePathname()
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const homeHref = localizeHref(locale, '/')
  const latestHref = localizeHref(locale, '/latest')
  const savedHref = localizeHref(locale, '/saved')
  const patroHref = patroEntryHref(locale)
  const unicodeHref = localizeHref(locale, '/preeti-unicode')
  const accountHref = account?.profileHref ?? localizeHref(locale, '/auth/login')
  const toggleHref = pathname ? swapLocale(pathname) : localizeHref(en ? 'ne' : 'en', '/')
  const primaryCategories = navCategories.slice(0, PRIMARY_NAV_SLOTS)
  const overflowCategories = navCategories.slice(PRIMARY_NAV_SLOTS)
  const [dateLabel, setDateLabel] = useState('')
  const [englishDateLabel, setEnglishDateLabel] = useState('')

  useEffect(() => {
    const now = new Date()
    setDateLabel(formatDate(now.toISOString(), locale))
    setEnglishDateLabel(
      now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    )
  }, [locale])

  const accountLabel = account
    ? account.kind === 'reader'
      ? en
        ? 'My account'
        : 'मेरो खाता'
      : en
        ? 'Staff'
        : 'कर्मचारी'
    : en
      ? 'Sign in'
      : 'लगइन'

  return (
    <>
      <header className="nw-masthead relative z-30 border-b border-chrome-rule bg-chrome text-on-chrome">
        <div className="mx-auto grid h-14 max-w-page grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-3 lg:hidden">
          <MobileNav locale={locale} navCategories={navCategories} account={account} />
          <Link
            href={homeHref}
            className="mx-auto min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} tone="chrome" compact />
          </Link>
          <SearchLauncher locale={locale} />
        </div>

        <div className="hidden border-b border-chrome-rule lg:block">
          <div className="mx-auto flex min-h-9 max-w-page items-center justify-between gap-4 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="whitespace-nowrap text-caption font-bold text-on-chrome" lang={lang} suppressHydrationWarning>
                {dateLabel || '\u00a0'}
              </span>
              <span className="hidden whitespace-nowrap text-[0.68rem] font-semibold text-on-chrome-soft xl:inline" lang="en" suppressHydrationWarning>
                {englishDateLabel || '\u00a0'}
              </span>
              {reference ? <span className="hidden min-w-0 xl:block">{reference}</span> : null}
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <Link href={unicodeHref} className={`${utilityLink} hidden 2xl:inline-flex`} lang={lang}>
                {en ? 'Unicode' : 'युनिकोड'}
              </Link>
              <Link href={savedHref} className={iconButton} title={dict.navSaved} aria-label={dict.navSaved}>
                <IconBookmark width={17} height={17} />
              </Link>
              <Link href={accountHref} className={`${utilityLink} hidden xl:inline-flex`} lang={lang}>
                <IconUser width={16} height={16} />
                <span className="max-w-[8rem] truncate">{accountLabel}</span>
              </Link>
              <SearchLauncher locale={locale} className="!h-9 !w-9 !text-on-chrome-soft" />
              <ThemeToggle
                locale={locale}
                className="!h-9 !w-9 !rounded-none !border-0 !text-on-chrome-soft hover:!bg-surface-raised/60 hover:!text-on-chrome"
              />
              <Link
                href={toggleHref}
                className="ml-1 inline-flex min-h-8 min-w-10 items-center justify-center border border-chrome-rule px-2 text-caption font-extrabold text-on-chrome transition-colors hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={en ? 'ne' : 'en'}
                aria-label={dict.localeToggleAria}
              >
                {en ? 'ने' : 'EN'}
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto hidden min-h-[4.75rem] max-w-page items-center gap-6 px-4 py-2.5 lg:flex">
          <Link
            href={homeHref}
            className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} tone="chrome" className="max-w-[18rem]" />
          </Link>
          <div className="flex-1" />
          {leaderboard ? (
            <div className="w-full max-w-[728px] shrink-0 xl:max-w-[760px]">{leaderboard}</div>
          ) : (
            <p className="max-w-sm text-right text-caption font-semibold leading-relaxed text-on-chrome-soft" lang={lang}>
              {en ? 'Verified reporting. Clear context.' : 'सत्यापित समाचार, स्पष्ट सन्दर्भ'}
            </p>
          )}
        </div>
      </header>

      <nav
        aria-label={dict.primaryNav}
        className="nw-masthead__primary sticky top-0 z-40 border-b border-black/15 bg-brand-bar text-paper"
      >
        <div className="mx-auto flex max-w-page items-stretch px-1 sm:px-3">
          <ul className="flex min-w-0 flex-1 flex-nowrap items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            {primaryCategories.map((category, index) => {
              const label = en && category.nameEn ? category.nameEn : category.nameNe
              const categoryLang = en && category.nameEn ? 'en' : 'ne'
              const href = localizeHref(locale, `/${category.slug}`)
              return (
                <li key={category.slug} className={index >= 5 ? 'hidden lg:block' : undefined}>
                  <NavLink href={href} active={pathsMatch(pathname, href)} lang={categoryLang}>
                    {label}
                  </NavLink>
                </li>
              )
            })}
            <li className="hidden md:block">
              <NavLink href={localizeHref(locale, '/province')} active={pathname.includes('/province')} lang={lang}>
                {en ? 'Provinces' : 'प्रदेश'}
              </NavLink>
            </li>
            <li className="hidden xl:block">
              <NavLink href={localizeHref(locale, '/fact-check')} active={pathname.includes('/fact-check')} lang={lang}>
                {en ? 'Fact check' : 'तथ्य-जाँच'}
              </NavLink>
            </li>
            <li className="ml-auto flex shrink-0 items-stretch border-l border-paper/25 pl-1 sm:pl-2">
              <Link
                href={patroHref}
                lang={lang}
                className="inline-flex min-h-11 items-center gap-1.5 bg-paper px-3 text-caption font-extrabold text-brand-strong transition-colors hover:bg-brand-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-paper sm:text-body"
              >
                <IconCalendar width={16} height={16} />
                {en ? 'Patro' : 'पात्रो'}
              </Link>
            </li>
            {overflowCategories.length > 0 ? (
              <li className="hidden shrink-0 lg:flex">
                <NavMoreMenu locale={locale} categories={overflowCategories} pathname={pathname} />
              </li>
            ) : null}
          </ul>
        </div>
      </nav>

      {topics.length > 0 ? <TopicsLinks locale={locale} topics={topics} /> : null}
    </>
  )
}

function HomeGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" focusable="false">
      <path d="M4 11.5 12 4l8 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10.5V20h10v-9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavLink({ href, active, lang, children }: { href: string; active?: boolean; lang?: string; children: ReactNode }) {
  return (
    <Link href={href} lang={lang} aria-current={active ? 'page' : undefined} className={navLinkClass(Boolean(active))}>
      {children}
    </Link>
  )
}

function NavMoreMenu({ locale, categories, pathname }: { locale: Locale; categories: Category[]; pathname: string }) {
  const en = locale === 'en'
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  useEffect(() => setOpen(false), [pathname])

  const hrefs = categories.map((category) => ({ category, href: localizeHref(locale, `/${category.slug}`) }))
  const activeInside = hrefs.some((entry) => pathsMatch(pathname, entry.href))

  return (
    <div ref={panelRef} className="relative flex items-stretch">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        lang={en ? 'en' : 'ne'}
        className={navLinkClass(activeInside)}
      >
        {en ? 'More' : 'थप'} <span aria-hidden="true">▾</span>
      </button>
      {open ? (
        <div className="absolute end-0 top-full z-50 w-[min(92vw,22rem)] border border-rule bg-surface-raised p-2 shadow-overlay">
          <ul className="grid grid-cols-2 gap-0.5">
            {hrefs.map(({ category, href }) => {
              const label = en && category.nameEn ? category.nameEn : category.nameNe
              const active = pathsMatch(pathname, href)
              return (
                <li key={category.slug}>
                  <Link
                    href={href}
                    lang={en && category.nameEn ? 'en' : 'ne'}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`block min-h-10 px-2.5 py-2 text-caption transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active
                        ? 'bg-brand-tint font-extrabold text-brand-strong'
                        : 'font-semibold text-ink hover:bg-surface hover:text-brand-strong'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
