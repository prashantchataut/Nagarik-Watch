'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, pathsMatch, swapLocale } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { STATIC_HUBS, PROVINCES } from '@/lib/site'
import type { AccountKind } from '@/lib/account-identity'
import {
  IconBookmark,
  IconCalendar,
  IconChart,
  IconClose,
  IconDesk,
  IconMenu,
  IconUser,
} from '@/components/icons/PortalIcons'

type MobileNavProps = {
  locale: Locale
  navCategories: Category[]
  account?: {
    kind: AccountKind
    displayName: string
    kindLabel: string
    roleLabel: string
    profileHref: string
  } | null
}

// 44×44 minimum touch target (WCAG 2.5.5).
const ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center rounded border border-chrome-rule/60 text-on-chrome transition-all duration-fast ease-out-quint hover:bg-surface-raised hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

const DRAWER_ICON_BTN =
  'inline-flex h-10 w-10 items-center justify-center rounded border border-rule text-ink-soft transition-all duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

const DRAWER_LINK =
  'block border-b border-rule/60 px-2 py-2.5 text-body font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40 hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

const DRAWER_LINK_ROW =
  'flex items-center gap-3 border-b border-rule/60 px-2 py-2.5 text-body font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/40 hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

export function MobileNav({ locale, navCategories, account = null }: MobileNavProps) {
  const dict = getDictionary(locale)
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const en = locale === 'en'

  useEffect(() => {
    function onOpenMenu() {
      setOpen(true)
    }
    window.addEventListener('nw:open-menu', onOpenMenu)
    return () => window.removeEventListener('nw:open-menu', onOpenMenu)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => !element.hasAttribute('hidden'))
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) return
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const pathname = usePathname() ?? '/'
  const homeHref = localizeHref(locale, '/')
  const savedHref = localizeHref(locale, '/saved')
  const readerCornerHref = localizeHref(locale, '/reader-corner')
  const toggleHref = swapLocale(pathname)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.openMenu}
        aria-expanded={open}
        aria-controls={titleId}
        className={ICON_BTN}
      >
        <IconMenu width={20} height={20} />
      </button>

      {open && (
        <div
          id={titleId}
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={dict.primaryNav}
        >
          {/* Backdrop */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-xs transition-opacity duration-base"
          />

          <div
            ref={dialogRef}
            className="absolute inset-y-0 left-0 flex w-full max-w-[20rem] sm:max-w-xs flex-col border-r border-rule bg-surface shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-rule px-4 py-3 bg-surface-raised">
              <span className="flex items-center gap-2">
                <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-8 w-8" />
                <span className="font-display text-h3 font-bold text-ink" lang="ne">
                  {dict.siteName}
                </span>
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dict.closeMenu}
                className={DRAWER_ICON_BTN}
              >
                <IconClose width={18} height={18} />
              </button>
            </div>

            {/* Quick Utility Tools Grid (Ratopati / OnlineKhabar standard) */}
            <div className="border-b border-rule bg-brand-tint/30 p-3">
              <p className="mb-2 text-[0.7rem] font-bold uppercase tracking-wider text-brand-strong">
                {en ? 'Quick Utilities' : 'उपयोगी सेवाहरू'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={patroEntryHref(locale)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded border border-brand/40 bg-surface px-2.5 py-2 text-caption font-bold text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
                >
                  <IconCalendar width={16} height={16} className="text-brand-strong shrink-0" />
                  <span>{en ? 'Patro' : 'पात्रो'}</span>
                </Link>
                <Link
                  href={localizeHref(locale, '/preeti-unicode')}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded border border-rule bg-surface px-2.5 py-2 text-caption font-bold text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
                >
                  <span className="text-brand-strong font-extrabold text-xs">⌨</span>
                  <span>{en ? 'Unicode' : 'युनिकोड'}</span>
                </Link>
                <Link
                  href={localizeHref(locale, '/market')}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded border border-rule bg-surface px-2.5 py-2 text-caption font-bold text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
                >
                  <IconChart width={16} height={16} className="text-brand-strong shrink-0" />
                  <span>{en ? 'NEPSE' : 'सेयर/सुन'}</span>
                </Link>
                <Link
                  href={localizeHref(locale, '/utilities/date-converter')}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded border border-rule bg-surface px-2.5 py-2 text-caption font-bold text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
                >
                  <span className="text-brand-strong font-extrabold text-xs">⇄</span>
                  <span>{en ? 'Date Conv.' : 'मिति रूपान्तरण'}</span>
                </Link>
              </div>
            </div>

            {/* Scrollable Navigation Body */}
            <nav aria-label={dict.primaryNav} className="flex-1 overflow-y-auto px-3 py-2">
              <DrawerSection label={en ? 'News Desks' : 'समाचार विभाग'} lang={en ? 'en' : 'ne'}>
                <li>
                  <Link
                    href={homeHref}
                    onClick={() => setOpen(false)}
                    aria-current={pathsMatch(pathname, homeHref) ? 'page' : undefined}
                    className={`${DRAWER_LINK} font-bold text-brand-strong`}
                  >
                    {dict.home}
                  </Link>
                </li>
                {navCategories.map((c) => {
                  const label = en && c.nameEn ? c.nameEn : c.nameNe
                  const catLang = en && c.nameEn ? 'en' : 'ne'
                  const href = localizeHref(locale, `/${c.slug}`)
                  return (
                    <li key={c.slug}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        lang={catLang}
                        aria-current={pathsMatch(pathname, href) ? 'page' : undefined}
                        className={DRAWER_LINK}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </DrawerSection>

              <DrawerSection label={en ? 'Provinces' : 'प्रदेश समाचार'} lang={en ? 'en' : 'ne'}>
                {PROVINCES.map((province) => (
                  <li key={province.slug}>
                    <Link
                      href={localizeHref(locale, `/province/${province.slug}`)}
                      onClick={() => setOpen(false)}
                      lang={en ? 'en' : 'ne'}
                      className={DRAWER_LINK}
                    >
                      {en ? province.nameEn : province.nameNe}
                    </Link>
                  </li>
                ))}
              </DrawerSection>

              <DrawerSection
                label={
                  account
                    ? en
                      ? 'Your Account'
                      : 'तपाईंको खाता'
                    : en
                      ? 'Reader Services'
                      : 'पाठक सेवा'
                }
                lang={en ? 'en' : 'ne'}
              >
                <li>
                  <Link
                    href={account?.profileHref ?? localizeHref(locale, '/auth/login')}
                    onClick={() => setOpen(false)}
                    className={DRAWER_LINK_ROW}
                  >
                    <IconUser width={16} height={16} />
                    <span>
                      {account
                        ? account.kind === 'reader'
                          ? en
                            ? 'My account'
                            : 'मेरो खाता'
                          : en
                            ? 'Account'
                            : 'खाता'
                        : en
                          ? 'Reader sign in'
                          : 'पाठक लगइन'}
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={readerCornerHref}
                    onClick={() => setOpen(false)}
                    className={DRAWER_LINK_ROW}
                  >
                    <IconDesk width={16} height={16} />
                    <span>{en ? 'Reading desk' : 'पढाइ डेस्क'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={savedHref} onClick={() => setOpen(false)} className={DRAWER_LINK_ROW}>
                    <IconBookmark width={16} height={16} />
                    <span>{en ? 'Saved stories' : 'सुरक्षित समाचार'}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={toggleHref}
                    onClick={() => setOpen(false)}
                    lang={en ? 'ne' : 'en'}
                    aria-label={dict.localeToggleAria}
                    className={`${DRAWER_LINK} font-bold text-brand-strong`}
                  >
                    {en ? 'नेपालीमा पढ्नुहोस्' : 'Read in English'}
                  </Link>
                </li>
                <li className="border-b border-rule/60 px-1 py-3 flex items-center justify-between">
                  <span className="text-body font-semibold text-ink">
                    {en ? 'Theme Mode' : 'थिम चयन'}
                  </span>
                  <ThemeToggle locale={locale} className="!rounded-md border border-rule" />
                </li>
              </DrawerSection>

              <DrawerSection label={en ? 'Special Hubs' : 'विशेष खण्डहरू'} lang={en ? 'en' : 'ne'}>
                {STATIC_HUBS.filter((hub) =>
                  [
                    'latest',
                    'trending',
                    'most-read',
                    'exclusive',
                    'market',
                    'utilities',
                    'fact-check',
                    'rashifal',
                    'sports-live',
                    'video',
                    'photos',
                  ].includes(hub.key),
                ).map((hub) => (
                  <li key={hub.key}>
                    <Link
                      href={localizeHref(locale, hub.path)}
                      onClick={() => setOpen(false)}
                      lang={en ? 'en' : 'ne'}
                      className={DRAWER_LINK}
                    >
                      {en ? hub.titleEn : hub.titleNe}
                    </Link>
                  </li>
                ))}
              </DrawerSection>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

function DrawerSection({
  label,
  lang,
  children,
}: {
  label: string
  lang: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <p
        className="px-2 pb-1 pt-2.5 text-[0.72rem] font-bold uppercase tracking-wider text-mute"
        lang={lang}
      >
        {label}
      </p>
      <ul className="flex flex-col">{children}</ul>
    </div>
  )
}
