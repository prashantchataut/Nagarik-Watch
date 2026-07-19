'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, swapLocale } from '@/lib/i18n/locales'
import { LogoMark } from '@/components/Logo'
import { STATIC_HUBS, PROVINCES } from '@/lib/site'
import type { AccountKind } from '@/lib/account-identity'
import {
  IconBookmark,
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
  'inline-flex h-11 w-11 items-center justify-center border border-transparent text-ink-soft transition-colors duration-fast ease-out-quint hover:border-rule hover:bg-brand-tint hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

const DRAWER_LINK =
  'block border-b border-rule px-1 py-3 text-body-lg text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

const DRAWER_LINK_ROW =
  'flex items-center gap-3 border-b border-rule px-1 py-3 text-body-lg text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

/**
 * Mobile primary navigation. The masthead's inline category list wraps on small screens but
 * eats vertical space and pushes the wordmark around, so below the `md` breakpoint it is
 * replaced by a hamburger that opens this slide-in drawer. The same links appear, in the same
 * order, so the navigation model stays consistent across viewports.
 *
 * The drawer is a real dialog: focus moves into it on open, Escape closes it, a backdrop click
 * closes it, and the page behind is inert (via the body-scroll lock + overlay). Routing happens
 * through plain Links, so a selection navigates and unmounts the drawer in one step.
 */
export function MobileNav({ locale, navCategories, account = null }: MobileNavProps) {
  const dict = getDictionary(locale)
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  // Lock background scroll while the drawer is open and release it on close. The previous
  // overflow value is restored rather than forced to 'visible' so any other style on <body>
  // survives.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // On open, move focus to the close button; Escape closes and Tab is trapped
  // inside the dialog. The overlay alone does not make background controls inert.
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
  const profileHref = localizeHref(locale, '/auth/profile')
  const readerCornerHref = localizeHref(locale, '/reader-corner')
  const toggleHref = swapLocale(pathname)

  return (
    <div className="md:hidden">
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
          {/* Backdrop: click anywhere outside the panel to dismiss. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-sm"
          />

          <div
            ref={dialogRef}
            className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-surface shadow-overlay"
          >
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <span className="flex items-center gap-2">
                <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-9 w-9" />
                <span className="font-display text-h3 font-bold text-ink" lang="ne">
                  {dict.siteName}
                </span>
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dict.closeMenu}
                className={ICON_BTN}
              >
                <IconClose width={20} height={20} />
              </button>
            </div>

            <nav aria-label={dict.primaryNav} className="flex-1 overflow-y-auto px-3 py-3">
              <DrawerSection
                label={locale === 'en' ? 'News' : 'समाचार'}
                lang={locale === 'en' ? 'en' : 'ne'}
              >
                <li>
                  <Link
                    href={homeHref}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === homeHref ? 'page' : undefined}
                    className={`${DRAWER_LINK} font-semibold text-ink`}
                  >
                    {dict.home}
                  </Link>
                </li>
                {navCategories.map((c) => {
                  const label = locale === 'en' && c.nameEn ? c.nameEn : c.nameNe
                  const catLang = locale === 'en' && c.nameEn ? 'en' : 'ne'
                  return (
                    <li key={c.slug}>
                      <Link
                        href={localizeHref(locale, `/${c.slug}`)}
                        onClick={() => setOpen(false)}
                        lang={catLang}
                        aria-current={
                          pathname === localizeHref(locale, `/${c.slug}`) ||
                          pathname.startsWith(`${localizeHref(locale, `/${c.slug}`)}/`)
                            ? 'page'
                            : undefined
                        }
                        className={DRAWER_LINK}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </DrawerSection>

              <DrawerSection
                label={locale === 'en' ? 'Provinces' : 'प्रदेश'}
                lang={locale === 'en' ? 'en' : 'ne'}
              >
                {PROVINCES.map((province) => (
                  <li key={province.slug}>
                    <Link
                      href={localizeHref(locale, `/province/${province.slug}`)}
                      onClick={() => setOpen(false)}
                      lang={locale === 'en' ? 'en' : 'ne'}
                      className={DRAWER_LINK}
                    >
                      {locale === 'en' ? province.nameEn : province.nameNe}
                    </Link>
                  </li>
                ))}
              </DrawerSection>

              <DrawerSection
                label={
                  account
                    ? locale === 'en'
                      ? 'Your account'
                      : 'तपाईंको खाता'
                    : locale === 'en'
                      ? 'Reader account'
                      : 'पाठक खाता'
                }
                lang={locale === 'en' ? 'en' : 'ne'}
              >
                <li>
                  <Link
                    href={account?.profileHref ?? localizeHref(locale, '/auth/login')}
                    onClick={() => setOpen(false)}
                    className={DRAWER_LINK_ROW}
                  >
                    <IconUser />
                    <span>
                      {account
                        ? account.kind === 'reader'
                          ? `${account.displayName} · ${account.kindLabel}`
                          : locale === 'en'
                            ? 'Account'
                            : 'खाता'
                        : locale === 'en'
                          ? 'Reader sign in'
                          : 'पाठक लगइन'}
                    </span>
                  </Link>
                </li>
                {account?.kind === 'reader' ? (
                  <li>
                    <p
                      className="border-b border-rule px-1 py-2 text-caption text-mute"
                      lang={locale === 'en' ? 'en' : 'ne'}
                    >
                      {account.roleLabel}
                    </p>
                  </li>
                ) : null}
                <li>
                  <Link
                    href={readerCornerHref}
                    onClick={() => setOpen(false)}
                    className={DRAWER_LINK_ROW}
                  >
                    <IconDesk />
                    <span>{locale === 'en' ? 'My news desk' : 'मेरो समाचार डेस्क'}</span>
                  </Link>
                </li>
                <li>
                  <Link href={savedHref} onClick={() => setOpen(false)} className={DRAWER_LINK_ROW}>
                    <IconBookmark />
                    <span>{locale === 'en' ? 'Saved stories' : 'सुरक्षित समाचार'}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={profileHref}
                    onClick={() => setOpen(false)}
                    className={DRAWER_LINK_ROW}
                  >
                    <IconUser />
                    <span>{locale === 'en' ? 'Profile' : 'प्रोफाइल'}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={toggleHref}
                    onClick={() => setOpen(false)}
                    lang={locale === 'en' ? 'ne' : 'en'}
                    aria-label={dict.localeToggleAria}
                    className={`${DRAWER_LINK} font-semibold text-brand-strong`}
                  >
                    {locale === 'en' ? 'नेपालीमा पढ्नुहोस्' : 'Read in English'}
                  </Link>
                </li>
              </DrawerSection>

              <DrawerSection
                label={locale === 'en' ? 'Tools and hubs' : 'उपकरण र हब'}
                lang={locale === 'en' ? 'en' : 'ne'}
              >
                {STATIC_HUBS.filter((hub) =>
                  [
                    'latest',
                    'trending',
                    'most-read',
                    'market',
                    'utilities',
                    'rashifal',
                    'sports-live',
                    'election',
                    'disaster-alerts',
                    'video',
                    'photos',
                    'fact-check',
                    'submit-story',
                  ].includes(hub.key),
                ).map((hub) => (
                  <li key={hub.key}>
                    <Link
                      href={localizeHref(locale, hub.path)}
                      onClick={() => setOpen(false)}
                      lang={locale === 'en' ? 'en' : 'ne'}
                      className={DRAWER_LINK}
                    >
                      {locale === 'en' ? hub.titleEn : hub.titleNe}
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

/** A labeled group of links inside the mobile drawer, so the list isn't a flat wall. */
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
    <div className="mb-2">
      <p
        className="px-3 pb-1 pt-3 text-meta font-semibold uppercase tracking-wide text-mute"
        lang={lang}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  )
}
