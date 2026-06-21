'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

type MobileNavProps = {
  locale: Locale
  navCategories: Category[]
}

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
export function MobileNav({ locale, navCategories }: MobileNavProps) {
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

  // On open, move focus to the close button; on Escape, close. Focus is trapped loosely:
  // Tab cycles within the dialog because the overlay covers everything behind it.
  useEffect(() => {
    if (!open) return
    closeBtnRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const homeHref = localizeHref(locale, '/')

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.openMenu}
        aria-expanded={open}
        aria-controls={titleId}
        className="rounded-sm p-2 text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong"
      >
        <MenuIcon />
      </button>

      {open && (
        <div
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
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-surface shadow-overlay"
          >
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <span id={titleId} className="font-display text-h3 text-ink" lang="ne">
                {dict.siteName}
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={dict.closeMenu}
                className="rounded-sm p-2 text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong"
              >
                <CloseIcon />
              </button>
            </div>

            <nav aria-label={dict.primaryNav} className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="flex flex-col divide-y divide-rule">
                <li>
                  <Link
                    href={homeHref}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-body-lg font-semibold text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
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
                        className="block py-3 text-body-lg text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuIcon() {
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
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
