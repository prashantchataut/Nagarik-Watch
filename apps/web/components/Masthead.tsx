'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, swapLocale } from '@/lib/i18n/locales'
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
  'inline-flex min-h-9 items-center gap-1 px-2 text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const UTIL_ICON =
  'inline-flex h-9 w-9 items-center justify-center text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const PRIMARY_CTA =
  'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 text-caption font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

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
    const onScroll = () => setCondensed(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="nw-masthead sticky top-0 z-40 border-b border-rule bg-surface"
      data-condensed={condensed ? 'true' : 'false'}
    >
      {/* Band 1 — Utility */}
      <div className="nw-masthead__utility border-b border-rule bg-surface-raised">
        <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-3 py-1 sm:px-4">
          <p lang={lang} className="min-w-0 truncate text-caption font-semibold text-ink-soft" suppressHydrationWarning>
            {dateLabel ? dict.mastheadDate(dateLabel) : '\u00a0'}
            {dateLabel ? (
              <>
                <span className="mx-1.5 text-mute" aria-hidden="true">
                  ·
                </span>
                <span className="text-brand-strong">{locale === 'en' ? 'Kathmandu' : 'काठमाडौं'}</span>
              </>
            ) : null}
          </p>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link href={utilitiesHref} className={`${UTIL_LINK} hidden sm:inline-flex`} lang={lang}>
              {locale === 'en' ? 'Utilities' : 'पात्रो / मिति'}
            </Link>
            <Link
              href={localizeHref(locale, '/contact')}
              className={`${UTIL_LINK} hidden md:inline-flex`}
              lang={lang}
            >
              {locale === 'en' ? 'Contact' : 'सम्पर्क'}
            </Link>
            <span className="mx-1 hidden h-4 w-px bg-rule sm:block" aria-hidden="true" />
            <Link
              href={accountHref}
              className={`${UTIL_LINK} hidden sm:inline-flex`}
              lang={lang}
              title={accountTitle}
            >
              <IconUser />
              <span className="max-w-[7rem] truncate">{accountLabel}</span>
            </Link>
            <Link href={savedHref} className={`${UTIL_ICON} hidden sm:inline-flex`} title={dict.navSaved} aria-label={dict.navSaved}>
              <IconBookmark />
            </Link>
            <Link href={searchHref} className={UTIL_ICON} title={dict.search} aria-label={dict.search}>
              <IconSearch />
            </Link>
            <ThemeToggle locale={locale} className="!h-9 !w-9 !rounded-none" />
          </div>
        </div>
      </div>

      {/* Band 2 — Brand */}
      <div className="mx-auto max-w-page px-3 sm:px-4">
        <div className="nw-masthead__brand grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-ink py-2.5 md:grid-cols-[1fr_auto_1fr] md:border-b-2 md:py-3.5">
          <div className="flex items-center md:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
          </div>

          <div className="hidden md:block" aria-hidden="true" />

          <Link
            href={homeHref}
            className="nw-masthead__logo min-w-0 justify-self-center transition-opacity duration-fast ease-out-quint hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo
              siteName={dict.siteName}
              className="max-w-[11rem] sm:max-w-[14rem] md:max-w-none md:scale-110"
            />
          </Link>

          <div className="flex items-center justify-end">
            <Link
              href={toggleHref}
              className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-md bg-brand px-3 text-meta font-black text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              lang={locale === 'en' ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {locale === 'en' ? 'नेपाली' : 'EN'}
            </Link>
          </div>
        </div>
      </div>

      {/* Band 3 — Primary categories (always on) */}
      <nav aria-label={dict.primaryNav} className="nw-masthead__primary border-t border-rule bg-surface">
        <div className="mx-auto flex max-w-page items-stretch gap-2 px-3 sm:px-4">
          <ul className="flex min-w-0 flex-1 flex-nowrap items-center gap-x-1 overflow-x-auto sm:gap-x-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li>
              <NavLink href={homeHref} active={pathname === '/' || pathname === '/en'}>
                <HomeGlyph />
                <span className="sr-only sm:not-sr-only">{dict.home}</span>
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

          <div className="hidden shrink-0 items-center gap-1.5 py-1.5 lg:flex">
            <Link href={latestHref} className={PRIMARY_CTA} lang={lang}>
              {dict.navLatest}
            </Link>
          </div>
        </div>
      </nav>

      {/* Band 4 — Topics */}
      <TopicsStrip locale={locale} topics={topics} />
    </header>
  )
}

function HomeGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
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
          ? 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-[3px] border-brand pt-[3px] text-meta font-black text-ink sm:text-body'
          : 'inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-[3px] border-transparent pt-[3px] text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-rule hover:text-ink sm:text-body'
      }
    >
      {children}
    </Link>
  )
}
