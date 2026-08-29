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
  account?: MastheadAccount | null
  reference?: ReactNode
}

const PRIMARY_NAV_SLOTS = 8

const factAction =
  'inline-flex min-h-10 items-center gap-1.5 px-2 text-caption font-bold text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const iconAction =
  'inline-flex h-10 w-10 items-center justify-center text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:bg-surface-raised hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

function navLinkClass(active: boolean) {
  return active
    ? 'inline-flex min-h-12 items-center gap-1.5 whitespace-nowrap border-b-[3px] border-paper bg-paper/10 px-3 text-caption font-black text-paper sm:text-body'
    : 'inline-flex min-h-12 items-center gap-1.5 whitespace-nowrap border-b-[3px] border-transparent px-3 text-caption font-bold text-paper/90 transition-colors duration-fast ease-out-quint hover:bg-paper/10 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-paper sm:text-body'
}

export function Masthead({ locale, navCategories, account = null, reference = null }: MastheadProps) {
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

  useEffect(() => {
    setDateLabel(formatDate(new Date().toISOString(), locale))
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

        <div className="mx-auto hidden min-h-[5.25rem] max-w-page items-center gap-8 px-4 lg:flex">
          <Link
            href={homeHref}
            className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} tone="chrome" className="max-w-[18.5rem]" />
          </Link>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-1">
            <div className="mr-2 hidden items-center gap-3 border-r border-chrome-rule pr-3 xl:flex">
              <span className="whitespace-nowrap text-caption font-bold text-on-chrome" lang={lang} suppressHydrationWarning>
                {dateLabel || '\u00a0'}
              </span>
              {reference ? <span className="min-w-0">{reference}</span> : null}
            </div>
            <Link href={unicodeHref} className={`${factAction} hidden 2xl:inline-flex`} lang={lang}>
              {en ? 'Unicode' : 'युनिकोड'}
            </Link>
            <Link href={savedHref} className={iconAction} title={dict.navSaved} aria-label={dict.navSaved}>
              <IconBookmark width={18} height={18} />
            </Link>
            <Link href={accountHref} className={`${factAction} hidden xl:inline-flex`} lang={lang}>
              <IconUser width={17} height={17} />
              <span className="max-w-[8rem] truncate">{accountLabel}</span>
            </Link>
            <SearchLauncher locale={locale} className="!h-10 !w-10 !text-on-chrome-soft" />
            <ThemeToggle
              locale={locale}
              className="!h-10 !w-10 !rounded-none !border-0 !text-on-chrome-soft hover:!bg-surface-raised hover:!text-brand-strong"
            />
            <Link
              href={toggleHref}
              className="inline-flex min-h-9 min-w-11 items-center justify-center border border-chrome-rule px-2 text-caption font-extrabold text-on-chrome transition-colors hover:border-brand hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              lang={en ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {en ? 'ने' : 'EN'}
            </Link>
            <Link
              href={patroHref}
              lang={lang}
              className="ml-2 inline-flex min-h-10 items-center gap-2 bg-brand px-4 text-body font-extrabold text-paper transition-colors hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <IconCalendar width={17} height={17} />
              {en ? 'Patro' : 'पात्रो'}
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label={dict.primaryNav}
        className="nw-masthead__primary sticky top-0 z-40 isolate transform-gpu border-b border-brand-bar-active bg-brand-bar text-paper"
      >
        <div className="mx-auto flex max-w-page items-stretch px-1 sm:px-3">
          <ul className="flex min-w-0 flex-1 flex-nowrap items-center overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
            {overflowCategories.length > 0 ? (
              <li className="hidden shrink-0 lg:flex">
                <NavMoreMenu locale={locale} categories={overflowCategories} pathname={pathname} />
              </li>
            ) : null}
            <li className="ml-auto shrink-0 border-l border-paper/25 lg:hidden">
              <Link
                href={patroHref}
                lang={lang}
                className="inline-flex min-h-12 items-center gap-1.5 bg-paper px-3 text-caption font-extrabold text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-paper sm:text-body"
              >
                <IconCalendar width={16} height={16} />
                {en ? 'Patro' : 'पात्रो'}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
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
