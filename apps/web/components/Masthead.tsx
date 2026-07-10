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

type MastheadProps = { locale: Locale; navCategories: Category[] }
const ICON_BTN =
  'inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong'

export function Masthead({ locale, navCategories }: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const dateLabel = formatDate(new Date().toISOString(), locale)
  const homeHref = localizeHref(locale, '/')
  const searchHref = localizeHref(locale, '/search')
  const savedHref = localizeHref(locale, '/saved')
  const toggleHref = swapLocale(pathname)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <header className="z-40 border-b border-rule bg-surface">
      <div className="border-b border-rule bg-surface-raised">
        <div className="mx-auto hidden max-w-page items-center justify-between gap-3 px-4 py-2 text-caption text-ink-soft sm:flex">
          <p lang={lang} className="truncate">
            {dict.mastheadDate(dateLabel)}
          </p>
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href={localizeHref(locale, '/latest')}
              className="font-semibold text-ink-soft hover:text-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'Latest' : 'ताजा'}
            </Link>
            <Link
              href={localizeHref(locale, '/contact')}
              className="font-semibold text-ink-soft hover:text-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'Contact' : 'सम्पर्क'}
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-page px-3 py-2.5 sm:px-4 sm:py-5">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 md:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-1 md:hidden">
            <MobileNav locale={locale} navCategories={navCategories} />
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href={savedHref}
              className="rounded-full border border-rule px-3.5 py-2 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
              lang={lang}
            >
              {dict.navSaved}
            </Link>
          </div>

          <Link
            href={homeHref}
            className="min-w-0 justify-self-center rounded-md transition-opacity hover:opacity-90"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} className="max-w-[11.5rem] sm:max-w-none" />
          </Link>

          <div className="flex items-center justify-end gap-0.5 sm:gap-1">
            <Link href={searchHref} className={ICON_BTN} aria-label={dict.search}>
              <SearchIcon />
            </Link>
            <ThemeToggle locale={locale} />
            <Link
              href={toggleHref}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-rule px-2.5 text-meta font-bold text-ink transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-strong sm:h-9 sm:px-3.5"
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
        className="sticky top-0 z-40 hidden border-t border-rule bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/88 md:block"
      >
        <div className="mx-auto max-w-page px-2 sm:px-4">
          <ul className="flex flex-nowrap items-center gap-x-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          ? 'inline-flex min-h-10 items-center whitespace-nowrap rounded-full bg-brand px-3.5 py-1.5 text-body font-bold text-surface'
          : 'inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-body font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong'
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
