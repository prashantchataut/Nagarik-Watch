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
import { SecondaryNav } from '@/components/SecondaryNav'
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
  account?: MastheadAccount | null
}

const TOOL =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 border-b-2 border-transparent py-2 text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const ICON_BTN =
  'inline-flex h-11 w-11 cursor-pointer items-center justify-center border-l border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

export function Masthead({ locale, navCategories, account = null }: MastheadProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const [condensed, setCondensed] = useState(false)
  const dateLabel = formatDate(new Date().toISOString(), locale)
  const homeHref = localizeHref(locale, '/')
  const searchHref = localizeHref(locale, '/search')
  const savedHref = localizeHref(locale, '/saved')
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
      <div className="nw-masthead__utility border-b border-rule bg-surface-raised">
        <div className="mx-auto flex max-w-page items-center justify-between gap-2 px-4 py-1.5 text-caption text-ink-soft">
          <p lang={lang} className="truncate font-semibold tracking-wide">
            {dict.mastheadDate(dateLabel)}
            <span className="mx-2 text-mute" aria-hidden="true">
              ·
            </span>
            <span className="text-brand-strong">{locale === 'en' ? 'Kathmandu' : 'काठमाडौं'}</span>
          </p>
          <div className="hidden items-center divide-x divide-rule sm:flex">
            <UtilityLink
              href={localizeHref(locale, '/contact')}
              label={locale === 'en' ? 'Contact' : 'सम्पर्क'}
              lang={lang}
            />
            <UtilityLink
              href={localizeHref(locale, '/about')}
              label={locale === 'en' ? 'About' : 'हाम्रो बारे'}
              lang={lang}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-page px-3 sm:px-4">
        <div className="nw-masthead__brand grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b-2 border-ink py-2.5 md:grid-cols-[1fr_auto_1fr] md:py-3">
          <div className="flex items-center md:hidden">
            <MobileNav locale={locale} navCategories={navCategories} account={account} />
          </div>

          <div className="hidden items-center md:flex">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href={accountHref} className={TOOL} lang={lang} title={accountTitle}>
                <IconUser />
                <span>{accountLabel}</span>
              </Link>
              <Link href={savedHref} className={TOOL} lang={lang}>
                <IconBookmark />
                <span>{dict.navSaved}</span>
              </Link>
            </div>
          </div>

          <Link
            href={homeHref}
            className="nw-masthead__logo min-w-0 justify-self-center transition-opacity duration-fast ease-out-quint hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={dict.siteName}
          >
            <Logo
              siteName={dict.siteName}
              className="max-w-[10rem] sm:max-w-[13rem] md:max-w-none md:scale-105"
            />
          </Link>

          <div className="flex items-center justify-end">
            <Link href={searchHref} className={`${ICON_BTN} border-l`} aria-label={dict.search}>
              <IconSearch width={20} height={20} />
            </Link>
            <ThemeToggle locale={locale} className="h-11 w-11 !rounded-none border-l border-rule" />
            <Link
              href={toggleHref}
              className="inline-flex h-11 min-w-11 cursor-pointer items-center justify-center border-l border-rule px-3 text-meta font-black text-ink transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
        className="nw-masthead__primary hidden border-t border-rule bg-surface md:block"
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
        </div>
      </nav>
    </header>
  )
}

function UtilityLink({
  href,
  label,
  lang,
}: {
  href: string
  label: string
  lang: string
}) {
  return (
    <Link
      href={href}
      lang={lang}
      className="inline-flex cursor-pointer items-center px-3 py-0.5 font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
    >
      {label}
    </Link>
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
          ? 'inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap border-b-[3px] border-brand pt-[3px] text-body font-black text-ink'
          : 'inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap border-b-[3px] border-transparent pt-[3px] text-body font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-rule hover:text-ink'
      }
    >
      {children}
    </Link>
  )
}
