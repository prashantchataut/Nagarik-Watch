'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'

type ThemeToggleProps = {
  locale: Locale
  className?: string
}

const STORAGE_KEY = 'nw-theme'
type Theme = 'light' | 'dark'

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  const current = document.documentElement.getAttribute('data-theme')
  return current === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable (private mode / disabled); the attribute still applies.
  }
}

/**
 * Light/dark toggle. The inline script in the locale layout resolves the initial theme before
 * paint (no flash), and the visible icon is selected purely by CSS based on data-theme, so this
 * component renders identical markup on server and client — no hydration mismatch, no
 * post-mount flip. State here only tracks the *next* theme for the accessible label, seeded
 * post-mount from data-theme (a screen-reader-only concern; the visual icon never depended on
 * it, so the label settling one tick after paint is not a visible flash).
 */
export function ThemeToggle({ locale, className }: ThemeToggleProps) {
  const dict = getDictionary(locale)
  const [next, setNext] = useState<Theme>('dark')

  useEffect(() => {
    setNext(readTheme() === 'dark' ? 'light' : 'dark')
  }, [])

  const label = next === 'light' ? dict.themeToggleToLight : dict.themeToggleToDark

  function toggle() {
    applyTheme(next)
    setNext(next === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`rounded-sm p-2 text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong ${className ?? ''}`}
    >
      <SunIcon />
      <MoonIcon />
    </button>
  )
}

function SunIcon() {
  return (
    <svg
      className="theme-icon-sun"
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      className="theme-icon-moon"
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
