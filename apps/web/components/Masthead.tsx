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

type MastheadProps = { locale: Locale; navCategories: Category[] }
const ICON_BTN = 'inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong sm:h-11 sm:w-11'

export function Masthead({ locale, navCategories }: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const dateLabel = formatDate(new Date().toISOString(), locale)
  const homeHref = localizeHref(locale, '/')
  const searchHref = localizeHref(locale, '/search')
  const accountHref = localizeHref(locale, '/auth/profile')
  const toggleHref = swapLocale(pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <SecondaryNav locale={locale} />
      <div className="mx-auto max-w-page px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center md:hidden"><MobileNav locale={locale} navCategories={navCategories} /></div>
          <Link href={homeHref} className="flex flex-1 justify-center rounded-md transition-opacity hover:opacity-90 md:flex-none md:justify-start" aria-label={dict.siteName}>
            <span className="flex md:hidden"><Logo siteName={dict.siteName} stacked /></span>
            <span className="hidden md:inline-flex"><Logo siteName={dict.siteName} /></span>
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="mr-2 hidden text-meta text-ink-soft lg:inline" lang={locale === 'en' ? 'en' : 'ne'}>{dict.mastheadDate(dateLabel)}</span>
            <Link href={searchHref} className={ICON_BTN} aria-label={dict.search}><SearchIcon /></Link>
            <ThemeToggle locale={locale} />
            <Link href={toggleHref} className="inline-flex h-8 items-center rounded-full border border-rule px-2.5 text-meta font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-strong sm:h-9 sm:px-3.5" lang={locale === 'en' ? 'ne' : 'en'} aria-label={dict.localeToggleAria}>{dict.localeToggleTo}</Link>
            <Link href={accountHref} className={ICON_BTN} aria-label={locale === 'en' ? 'Account' : 'खाता'} title={locale === 'en' ? 'Account' : 'खाता'}><AccountIcon /></Link>
          </div>
        </div>
        <nav aria-label={dict.primaryNav} className="hidden border-t border-rule pt-2 md:block">
          <ul className="flex flex-nowrap items-center gap-x-1 gap-y-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li><NavLink href={homeHref} active={pathname === '/' || pathname === '/en'}>{dict.home}</NavLink></li>
            {navCategories.map((c) => {
              const label = locale === 'en' && c.nameEn ? c.nameEn : c.nameNe
              const catLang = locale === 'en' && c.nameEn ? 'en' : 'ne'
              const href = localizeHref(locale, `/${c.slug}`)
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return <li key={c.slug}><NavLink href={href} active={active} lang={catLang}>{label}</NavLink></li>
            })}
            <ProvinceMegaMenu locale={locale} />
            {STATIC_HUBS.filter((hub) => ['latest', 'trending', 'utilities', 'fact-check'].includes(hub.key)).map((hub) => {
              const href = localizeHref(locale, hub.path)
              const active = pathname === href || pathname.startsWith(`${href}/`)
              return <li key={hub.key}><NavLink href={href} active={active} lang={locale === 'en' ? 'en' : 'ne'}>{locale === 'en' ? hub.titleEn : hub.titleNe}</NavLink></li>
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ href, active, lang, children }: { href: string; active?: boolean; lang?: string; children: React.ReactNode }) {
  return <Link href={href} lang={lang} aria-current={active ? 'page' : undefined} className={active ? 'inline-block whitespace-nowrap rounded-full bg-brand-tint px-3.5 py-1.5 text-body font-semibold text-brand-strong' : 'inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-body font-medium text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint/60 hover:text-brand-strong'}>{children}</Link>
}
function SearchIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg> }
function AccountIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg> }
