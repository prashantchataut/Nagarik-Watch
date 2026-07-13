'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'

type ThemeToggleProps = { locale: Locale; className?: string }
const STORAGE_KEY = 'nw-theme'
type Theme = 'light' | 'dark'

function readAppliedTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme, persist = false) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
  if (!persist) return
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // The visible preference remains applied when storage is unavailable.
  }
}

export function ThemeToggle({ locale, className }: ThemeToggleProps) {
  const dict = getDictionary(locale)
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(readAppliedTheme())
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function onSystemTheme(event: MediaQueryListEvent) {
      if (storedTheme()) return
      const next = event.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return
      const next = event.newValue === 'dark' ? 'dark' : event.newValue === 'light' ? 'light' : media.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }

    media.addEventListener('change', onSystemTheme)
    window.addEventListener('storage', onStorage)
    return () => {
      media.removeEventListener('change', onSystemTheme)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'light' ? dict.themeToggleToLight : dict.themeToggleToDark

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next, true)
        setTheme(next)
      }}
      aria-label={label}
      aria-pressed={theme === 'dark'}
      title={label}
      data-current-theme={theme}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand ${className ?? ''}`}
    >
      <SunIcon />
      <MoonIcon />
      <span className="sr-only">{label}</span>
    </button>
  )
}

function SunIcon() {
  return <svg className="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
}
function MoonIcon() {
  return <svg className="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
}
