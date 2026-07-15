'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Category, Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, swapLocale } from '@/lib/i18n/locales'
import { MobileNav } from '@/components/MobileNav'
import { ProvinceMegaMenu } from '@/components/ProvinceMegaMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Logo } from '@/components/Logo'
import { SecondaryNav } from '@/components/SecondaryNav'
import { STATIC_HUBS } from '@/lib/site'

type MastheadAccount = {
  displayName: string
  kindLabel: string
  roleLabel: string
  profileHref: string
}

type MastheadProps = {
  locale: Locale
  navCategories: Category[]
  account?: MastheadAccount | null
}
const ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center border-l border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong'

export function Masthead({ locale, navCategories, account = null }: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const dateLabel = formatDate(new Date().toISOString(), locale)
  const homeHref = localizeHref(locale, '/')
  const searchHref = localizeHref(locale, '/search')
  const savedHref = localizeHref(locale, '/saved')
  const toggleHref = swapLocale(pathname)
  const lang = locale === 'en' ? 'en' : 'ne'
  const accountHref = account?.profileHref ?? localizeHref(locale, '/auth/login')
  const accountLabel = account
    ? account.displayName
    : locale === 'en'
      ? 'Account'
      : 'खाता'

  return (
    <header className="nw-masthead z-40 border-b border-rule bg-surface">
      <div className="nw-masthead__utility border-b border-rule">
        <div className="mx-auto flex max-w-page items-center justify-between gap-3 px-4 py-2 text-caption text-ink-soft">
          <p lang={lang} className="truncate font-semibold tracking-wide">
            {dict.mastheadDate(dateLabel)}
            <span className="mx-2 text-mute" aria-hidden="true">
              ·
            </span>
            <span className="text-brand-strong">{locale === 'en' ? 'Kathmandu' : 'काठमाडौं'}</span>
          </p>
          <div className="hidden items-center divide-x divide-rule sm:flex">
            <Link
              href={localizeHref(locale, '/latest')}
              className="px-3 font-bold text-ink hover:text-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'Latest' : 'ताजा'}
            </Link>
            <Link
              href={localizeHref(locale, '/most-read')}
              className="px-3 font-semibold text-ink-soft hover:text-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'Most read' : 'धेरै पढिएको'}
            </Link>
            <Link
              href={localizeHref(locale, '/contact')}
              className="px-3 font-semibold text-ink-soft hover:text-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'Contact' : 'सम्पर्क'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-page px-3 sm:px-4">
        <div className="grid min-h-[6.5rem] grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-ink/80 py-3 md:grid-cols-[1fr_auto_1fr] md:py-4">
          <div className="flex items-center md:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
          </div>
          <div className="hidden items-center md:flex">
            <div className="flex items-center gap-4">
              <Link
                href={accountHref}
                className="border-b-2 border-transparent py-2 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-ink"
                lang={lang}
                title={account ? `${account.kindLabel} · ${account.roleLabel}` : undefined}
              >
                {accountLabel}
              </Link>
              {account ? (
                <span className="hidden text-caption text-mute lg:inline" lang={lang}>
                  {account.kindLabel}
                </span>
              ) : null}
              <Link
                href={localizeHref(locale, '/reader-corner')}
                className="border-b-2 border-transparent py-2 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-ink"
                lang={lang}
              >
                {locale === 'en' ? 'My news desk' : 'मेरो समाचार डेस्क'}
              </Link>
              <Link
                href={savedHref}
                className="border-b-2 border-transparent py-2 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-ink"
                lang={lang}
              >
                {dict.navSaved}
              </Link>
            </div>
          </div>

          <Link
            href={homeHref}
            className="min-w-0 justify-self-center transition-opacity hover:opacity-85"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} className="max-w-[16rem] sm:max-w-none md:scale-110" />
          </Link>

          <div className="flex items-center justify-end border-r border-rule">
            <Link href={searchHref} className={ICON_BTN} aria-label={dict.search}>
              <SearchIcon />
            </Link>
            <ThemeToggle locale={locale} className="h-10 w-10 !rounded-none border-l border-rule" />
            <Link
              href={toggleHref}
              className="inline-flex h-10 min-w-10 items-center justify-center border-l border-rule px-3 text-meta font-black text-ink transition-colors hover:bg-brand-tint hover:text-brand-strong"
              lang={locale === 'en' ? 'ne' : 'en'}
              aria-label={dict.localeToggleAria}
            >
              {locale === 'en' ? 'ने' : 'EN'}
            </Link>
          </div>
        </div>
      </div>

      <SecondaryNav locale={locale} />

      <nav
        aria-label={dict.primaryNav}
        className="sticky top-0 z-40 hidden border-t border-rule bg-surface/96 backdrop-blur supports-[backdrop-filter]:bg-surface/90 md:block"
      >
        <div className="mx-auto max-w-page px-4">
          <ul className="flex flex-nowrap items-center gap-x-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              ['latest', 'trending', 'utilities', 'fact-check'].includes(hub.key),
            ).map((hub) => {
              const href = localizeHref(locale, hub.path)
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <li key={hub.key}>
                  <NavLink href={href} active={active} lang={lang}>
                    {locale === 'en' ? hub.titleEn : hub.titleNe}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </header>
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
          ? 'inline-flex min-h-12 items-center whitespace-nowrap border-b-[3px] border-brand pt-[3px] text-body font-black text-ink'
          : 'inline-flex min-h-12 items-center whitespace-nowrap border-b-[3px] border-transparent pt-[3px] text-body font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-rule hover:text-ink'
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
