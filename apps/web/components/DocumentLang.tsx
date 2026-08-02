'use client'

import { useEffect } from 'react'

/**
 * When /en serves Nepali body (no English edition), keep the document language
 * honest for screen readers and browser translation heuristics.
 */
export function DocumentLang({ lang }: { lang: 'ne' | 'en' }) {
  useEffect(() => {
    const previous = document.documentElement.lang
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = previous
    }
  }, [lang])
  return null
}
