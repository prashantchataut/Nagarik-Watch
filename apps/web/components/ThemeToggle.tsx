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
 * paint (no flash), so this only needs to read data-theme on mount and then flip it on click.
 * Persisted under `nw-theme`, which the inline script reads first so a returning reader never
 * sees the wrong theme even for a frame.
 */
export function ThemeToggle({ locale, className }: ThemeToggleProps) {
  const dict = getDictionary(locale)
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(readTheme())
    setMounted(true)
  }, [])

  const isDark = theme === 'dark'
  const next: Theme = isDark ? 'light' : 'dark'
  const label = isDark ? dict.themeToggleToLight : dict.themeToggleToDark

  function toggle() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`rounded-sm p-2 text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong ${className ?? ''}`}
    >
      {mounted && isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
