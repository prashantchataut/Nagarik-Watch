'use client'

import { useEffect } from 'react'

/**
 * When /en serves Nepali body (no English edition), keep the document language
 * honest for screen readers and browser translation heuristics.
 */
export function DocumentLang({ lang }: { lang: 'ne' | 'en' }) {
  useEffect(() => {
    const root = document.documentElement
    const previous = root.lang
    if (previous !== lang) root.lang = lang
    return () => {
      if (root.lang === lang) root.lang = previous
    }
  }, [lang])
  return null
}
