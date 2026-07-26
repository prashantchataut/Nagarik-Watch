'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
import { IconBookmark, IconSearch, IconUser } from '@/components/icons/PortalIcons'

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
}

const UTIL_LINK =
  'inline-flex min-h-9 items-center gap-1.5 px-2 text-caption font-semibold text-white/80 transition-colors duration-fast ease-out-quint hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const UTIL_ICON =
  'inline-flex h-9 w-9 items-center justify-center text-white/80 transition-colors duration-fast ease-out-quint hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export function Masthead({ locale, navCategories, topics = [], account = null }: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const [condensed, setCondensed] = useState(false)
  const [dateLabel, setDateLabel] = useState('')
  const homeHref = localizeHref(locale, '/')
  const savedHref = localizeHref(locale, '/saved')
  const searchHref = localizeHref(locale, '/search')
  const utilitiesHref = localizeHref(locale, '/utilities')
  const latestHref = localizeHref(locale, '/latest')
  const toggleHref = swapLocale(pathname)
  const lang = locale === 'en' ? 'en' : 'ne'
  const accountHref = account?.profileHref ?? localizeHref(locale, '/auth/login')
  const accountLabel = account
    ? account.kind === 'reader'
      ? account.displayName
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
      {/* Band 1 — Black brand chrome: logo left, utilities right */}
      <div className="nw-masthead__chrome border-b border-white/10 bg-chrome text-paper">
        <div className="mx-auto flex max-w-page items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
          </div>

          <Link
            href={homeHref}
            className="nw-masthead__logo min-w-0 shrink transition-opacity duration-fast ease-out-quint hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo
              siteName={dict.siteName}
              tone="onDark"
              className="max-w-[11rem] sm:max-w-[15rem]"
            />
          </Link>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-0.5 sm:gap-1">
            <p
              className="nw-masthead__utility mr-1 hidden truncate text-caption font-semibold text-white/55 lg:block"
              lang={lang}
              suppressHydrationWarning
            >
              {dateLabel ? dict.mastheadDate(dateLabel) : '\u00a0'}
            </p>
            <Link
              href={utilitiesHref}
              className={`${UTIL_LINK} nw-masthead__utility hidden lg:inline-flex`}
              lang={lang}
            >
              {locale === 'en' ? 'Calendar' : 'पात्रो'}
            </Link>
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
            <Link href={searchHref} className={UTIL_ICON} title={dict.search} aria-label={dict.search}>
              <IconSearch />
            </Link>
            <ThemeToggle
              locale={locale}
              className="!h-9 !w-9 !rounded-none !text-white/80 hover:!bg-white/10 hover:!text-white"
            />
            <Link
              href={toggleHref}
              className="inline-flex h-9 min-w-[3.25rem] items-center justify-center bg-brand px-2.5 text-meta font-black text-white transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              lang={locale === 'en' ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {locale === 'en' ? 'ने' : 'EN'}
            </Link>
          </div>
        </div>
      </div>

      {/* Band 2 — Solid category desk */}
      <nav
        aria-label={dict.primaryNav}
        className="nw-masthead__primary border-b border-black/20 bg-brand-bar text-white"
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

          <div className="hidden shrink-0 items-center py-1.5 lg:flex">
            <Link
              href={latestHref}
              className="inline-flex min-h-9 items-center bg-white px-3 text-caption font-bold text-brand-bar transition-colors duration-fast ease-out-quint hover:bg-brand-tint"
              lang={lang}
            >
              {dict.navLatest}
            </Link>
          </div>
        </div>
      </nav>

      {!condensed ? (
        <TopicsStrip locale={locale} topics={topics} searchHref={searchHref} />
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
          ? 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap bg-brand-bar-active px-2.5 text-meta font-black text-white sm:px-3 sm:text-body'
          : 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap px-2.5 text-meta font-bold text-white/90 transition-colors duration-fast ease-out-quint hover:bg-brand-bar-active/85 hover:text-white sm:px-3 sm:text-body'
      }
    >
      {children}
    </Link>
  )
}
