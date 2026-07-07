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
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable; the visible theme still changes.
  }
}

/**
 * Accessible light/dark toggle. The layout script sets the initial data-theme
 * before paint; this client control only mirrors the current theme after mount.
 * It exposes aria-pressed for screen readers, updates color-scheme for native
 * controls, and stays in sync if another tab changes the stored preference.
 */
export function ThemeToggle({ locale, className }: ThemeToggleProps) {
  const dict = getDictionary(locale)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const current = readTheme()
    setTheme(current)
    document.documentElement.style.colorScheme = current

    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return
      const next = event.newValue === 'dark' ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'light' ? dict.themeToggleToLight : dict.themeToggleToDark

  function toggle() {
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      data-current-theme={theme}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint ${className ?? ''}`}
    >
      <SunIcon />
      <MoonIcon />
      <span className="sr-only">{label}</span>
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
