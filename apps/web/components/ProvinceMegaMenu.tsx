'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { PROVINCES } from '@/lib/site'

/**
 * ProvinceMegaMenu — a keyboard- and hover-disclosed dropdown listing Nepal's
 * seven provinces. Each entry links to /province/[slug]. The disclosure opens
 * on focus/hover and closes on blur/escape, following the WAI-APG menu-button
 * pattern (focusable trigger, focusable items, escape closes).
 *
 * Pattern chosen over a flat link list because a national portal's province
 * section is dense: a mega-menu surfaces all seven at once without consuming a
 * full nav slot per province.
 */
export function ProvinceMegaMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lang = locale === 'en' ? 'en' : 'ne'
  const label = locale === 'en' ? 'Provinces' : 'प्रदेश'

  function clearClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  function scheduleClose() {
    clearClose()
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <li
      className="relative"
      onMouseEnter={() => {
        clearClose()
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        clearClose()
        setOpen(true)
      }}
      onBlur={scheduleClose}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        className="inline-flex min-h-11 items-center gap-1 border-b-[3px] border-transparent px-1 pt-[3px] text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-rule hover:text-ink sm:text-body"
        lang={lang}
      >
        {label}
        <Chevron open={open} />
      </button>

      {open ? (
        <ul
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border border-rule bg-surface-raised p-2 shadow-overlay"
        >
          {PROVINCES.map((p) => {
            const href = localizeHref(locale, `/province/${p.slug}`)
            return (
              <li key={p.slug} role="none">
                <Link
                  role="menuitem"
                  href={href}
                  lang={lang}
                  onClick={() => setOpen(false)}
                  className="block rounded-sm px-3 py-2 text-body text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong"
                >
                  {locale === 'en' ? p.nameEn : p.nameNe}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
