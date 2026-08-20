'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, pathsMatch, swapLocale } from '@/lib/i18n/locales'
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
  /** Live reference (weather, markets) rendered inside the masthead row. */
  reference?: ReactNode
}

const UTIL_LINK =
  'inline-flex min-h-11 items-center gap-1.5 border border-transparent px-2.5 text-caption font-semibold text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:border-chrome-rule hover:bg-surface-raised/70 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const UTIL_ICON_BTN =
  'inline-flex h-11 w-11 items-center justify-center border border-transparent text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:border-chrome-rule hover:bg-surface-raised/70 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

/**
 * Desk slots shown directly in the crimson rail. The long tail moves into a
 * "more" menu so the bar keeps even rhythm instead of filling to the pixel and
 * silently scrolling the moment an editor adds a category.
 */
const PRIMARY_NAV_SLOTS = 9

function navLinkClass(active: boolean) {
  return active
    ? 'inline-flex min-h-11 items-center gap-1 whitespace-nowrap border-b-2 border-paper bg-brand-bar-active px-3 text-caption font-black text-paper sm:px-3.5 sm:text-body'
    : 'inline-flex min-h-11 items-center gap-1 whitespace-nowrap border-b-2 border-transparent px-3 text-caption font-bold text-paper/90 transition-colors duration-fast ease-out-quint hover:border-paper/70 hover:bg-brand-bar-active/65 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-paper sm:px-3.5 sm:text-body'
}

export function Masthead({
  locale,
  navCategories,
  topics = [],
  account = null,
  leaderboard = null,
  reference = null,
}: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const primaryCategories = navCategories.slice(0, PRIMARY_NAV_SLOTS)
  const overflowCategories = navCategories.slice(PRIMARY_NAV_SLOTS)
  const [dateLabel, setDateLabel] = useState('')
  const [englishDateLabel, setEnglishDateLabel] = useState('')
  const homeHref = localizeHref(locale, '/')
  const savedHref = localizeHref(locale, '/saved')
  const latestHref = localizeHref(locale, '/latest')
  const patroHref = patroEntryHref(locale)
  const unicodeHref = localizeHref(locale, '/preeti-unicode')
  const toggleHref = swapLocale(pathname)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'
  const accountHref = account?.profileHref ?? localizeHref(locale, '/auth/login')
  const accountLabel = account
    ? account.kind === 'reader'
      ? en
        ? 'My account'
        : 'मेरो खाता'
      : en
        ? 'Account'
        : 'खाता'
    : en
      ? 'Sign in'
      : 'लगइन'
  const accountTitle = account
    ? account.kind === 'reader'
      ? `${account.kindLabel} · ${account.roleLabel}`
      : en
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

  return (
    <>
      <header className="nw-masthead sticky top-0 z-40">
        <div className="nw-masthead__chrome border-b border-chrome-rule bg-chrome text-on-chrome shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mx-auto grid h-14 max-w-page grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center px-3 lg:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
            <Link
              href={homeHref}
              className="nw-masthead__logo mx-auto min-w-0 transition-opacity duration-fast ease-out-quint hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={dict.siteName}
            >
              <Logo siteName={dict.siteName} tone="chrome" compact />
            </Link>
            <SearchLauncher locale={locale} />
          </div>

          <div className="mx-auto hidden min-h-16 max-w-page items-center gap-4 px-4 py-2 lg:flex">
            <div className="flex min-w-0 items-center gap-3.5">
              <Link
                href={homeHref}
                className="nw-masthead__logo min-w-0 shrink transition-opacity duration-fast ease-out-quint hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-label={dict.siteName}
              >
                <Logo siteName={dict.siteName} tone="chrome" className="max-w-[15rem]" />
              </Link>
              <div className="hidden flex-col border-l border-chrome-rule pl-3.5 leading-tight xl:flex">
                <span
                  className="whitespace-nowrap text-caption font-bold text-on-chrome"
                  lang={lang}
                  suppressHydrationWarning
                >
                  {dateLabel || '\u00a0'}
                </span>
                <span
                  className="whitespace-nowrap text-[0.68rem] font-medium text-on-chrome-soft"
                  lang="en"
                  suppressHydrationWarning
                >
                  {englishDateLabel || '\u00a0'}
                </span>
              </div>
              {reference}
            </div>

            {leaderboard ? (
              <div className="nw-masthead__leaderboard flex min-w-0 flex-1 justify-center px-2">
                <div className="w-full max-w-[728px]">{leaderboard}</div>
              </div>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex min-w-0 shrink-0 items-center justify-end gap-1">
              <Link
                href={unicodeHref}
                className={`${UTIL_LINK} hidden 2xl:inline-flex`}
                lang={lang}
                title={en ? 'Preeti to Unicode converter' : 'प्रिती युनिकोड रूपान्तरण'}
              >
                <span className="font-bold">{en ? 'Unicode' : 'युनिकोड'}</span>
              </Link>
              <Link
                href={savedHref}
                className={UTIL_ICON_BTN}
                title={dict.navSaved}
                aria-label={dict.navSaved}
              >
                <IconBookmark width={17} height={17} />
              </Link>
              <Link
                href={accountHref}
                className={`${UTIL_LINK} hidden xl:inline-flex`}
                lang={lang}
                title={accountTitle}
              >
                <IconUser width={17} height={17} />
                <span className="max-w-[7rem] truncate">{accountLabel}</span>
              </Link>
              <SearchLauncher locale={locale} className="!text-on-chrome-soft" />
              <ThemeToggle
                locale={locale}
                className="!h-11 !w-11 !rounded-none !border !border-transparent !text-on-chrome-soft hover:!border-chrome-rule hover:!bg-surface-raised/70 hover:!text-on-chrome"
              />
              <Link
                href={toggleHref}
                className="inline-flex min-h-11 min-w-11 items-center justify-center border border-chrome-rule bg-surface-raised/60 px-2 text-caption font-extrabold text-on-chrome transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={en ? 'ne' : 'en'}
                aria-label={dict.localeToggleAria}
              >
                {en ? 'नेपाली' : 'EN'}
              </Link>
            </div>
          </div>
        </div>

        <nav
          aria-label={dict.primaryNav}
          className="nw-masthead__primary hidden border-b border-black/15 bg-brand-bar text-paper lg:block"
        >
          <div className="relative mx-auto flex max-w-page items-stretch px-2 sm:px-4">
            <ul className="nw-masthead__navrail flex min-w-0 flex-1 flex-nowrap items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              {primaryCategories.map((category) => {
                const label = en && category.nameEn ? category.nameEn : category.nameNe
                const categoryLang = en && category.nameEn ? 'en' : 'ne'
                const href = localizeHref(locale, `/${category.slug}`)
                return (
                  <li key={category.slug}>
                    <NavLink href={href} active={pathsMatch(pathname, href)} lang={categoryLang}>
                      {label}
                    </NavLink>
                  </li>
                )
              })}
              <li>
                <NavLink
                  href={localizeHref(locale, '/province')}
                  active={pathname.includes('/province')}
                  lang={lang}
                >
                  {en ? 'Provinces' : 'प्रदेश'}
                </NavLink>
              </li>
              <li>
                <NavLink
                  href={localizeHref(locale, '/fact-check')}
                  active={pathname.includes('/fact-check')}
                  lang={lang}
                >
                  {en ? 'Fact check' : 'तथ्य-जाँच'}
                </NavLink>
              </li>
              <li className="ms-2 flex shrink-0 items-stretch border-l border-paper/25 pl-2">
                <Link
                  href={patroHref}
                  lang={lang}
                  className="inline-flex min-h-11 items-center gap-1.5 bg-paper px-3.5 text-body font-extrabold text-brand-strong transition-colors duration-fast ease-out-quint hover:bg-brand-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-paper"
                >
                  <IconCalendar width={16} height={16} />
                  <span>{en ? 'Patro' : 'पात्रो'}</span>
                </Link>
              </li>
              {overflowCategories.length > 0 ? (
                <li className="ms-auto hidden shrink-0 lg:flex">
                  <NavMoreMenu
                    locale={locale}
                    categories={overflowCategories}
                    pathname={pathname}
                  />
                </li>
              ) : null}
            </ul>
          </div>
        </nav>
      </header>
      {topics.length > 0 ? <TopicsLinks locale={locale} topics={topics} /> : null}
    </>
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
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      lang={lang}
      aria-current={active ? 'page' : undefined}
      className={navLinkClass(Boolean(active))}
    >
      {children}
    </Link>
  )
}

/**
 * Long-tail desks. Kept in a menu so the crimson rail never runs edge to edge.
 */
function NavMoreMenu({
  locale,
  categories,
  pathname,
}: {
  locale: Locale
  categories: Category[]
  pathname: string
}) {
  const en = locale === 'en'
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  // Close on navigation so the panel never lingers over the next page.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const hrefs = categories.map((category) => ({
    category,
    href: localizeHref(locale, `/${category.slug}`),
  }))
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
        <span>{en ? 'More' : 'थप'}</span>
        <span aria-hidden="true" className="text-paper/75">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute end-0 top-full z-50 w-[min(92vw,22rem)] border border-rule bg-surface-raised p-2 shadow-md">
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
                    className={
                      active
                        ? 'block px-2 py-2 text-caption font-extrabold text-brand-strong'
                        : 'block px-2 py-2 text-caption font-semibold text-ink transition-colors duration-fast ease-out-quint hover:bg-surface hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
                    }
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
