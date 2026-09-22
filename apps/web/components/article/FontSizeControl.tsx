'use client'

import { useEffect } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { useClientState } from '@/lib/browser/use-client-state'

/**
 * FontSizeControl — three-step reader text resize (A− / A / A+), spec Phase 5 "font size
 * control" and Phase 12 visual accessibility "text resize support". Important for older
 * readers and for comfortable Devanagari reading on small screens (PRODUCT.md: older
 * readers, mid-range phones).
 *
 * Mechanism: it sets `data-reading-size` on <html>; globals.css scales the article body's
 * `--reading-scale` from that attribute (so the choice cannot leak into chrome or cards).
 * The choice persists in localStorage and is re-applied on mount. No layout properties are
 * animated; font-size changes reflow once on click, which is acceptable for an explicit
 * user action.
 *
 * Accessibility: a labelled radiogroup, full 36px+ targets, the current size has
 * aria-checked, and a screen-reader-only label names the control.
 */
const SIZES = ['sm', 'base', 'lg'] as const
type Size = (typeof SIZES)[number]
const STORAGE_KEY = 'nw-reading-size'

function apply(size: Size) {
  document.documentElement.setAttribute('data-reading-size', size)
}

function storedSize(): Size {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Size | null
    return stored && SIZES.includes(stored) ? stored : 'base'
  } catch {
    // localStorage unavailable (private mode); fall back to default size silently.
    return 'base'
  }
}

export function FontSizeControl({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  // 'base' on the server: the prerendered article always ships the default
  // scale, then the stored choice is applied in the first browser render.
  const [size, setSize] = useClientState<Size>(storedSize, 'base')

  // One place writes the attribute, for both the restored and the chosen size.
  useEffect(() => {
    apply(size)
  }, [size])

  function choose(next: Size) {
    setSize(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore persistence failure
    }
  }

  const steps: { value: Size; label: string; aria: string; cls: string }[] = [
    { value: 'sm', label: 'A', aria: dict.fontSizeSmaller, cls: 'text-[0.8rem]' },
    { value: 'base', label: 'A', aria: dict.fontSizeReset, cls: 'text-[1rem]' },
    { value: 'lg', label: 'A', aria: dict.fontSizeLarger, cls: 'text-[1.2rem]' },
  ]

  return (
    <div role="radiogroup" aria-label={dict.fontSizeLabel} className="article-font-control">
      {steps.map((s) => {
        const active = size === s.value
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={s.aria}
            onClick={() => choose(s.value)}
            className={`article-font-control__step ${s.cls} ${active ? 'article-font-control__step--active' : ''}`}
          >
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
