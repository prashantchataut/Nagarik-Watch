'use client'

import { useEffect } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import {
  createBrowserStore,
  notifyBrowserStore,
  useBrowserStore,
} from '@/lib/browser/use-browser-store'

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

function readStoredSize(): Size {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Size | null
    return stored && SIZES.includes(stored) ? stored : 'base'
  } catch {
    // localStorage unavailable (private mode); fall back to the default size.
    return 'base'
  }
}

function apply(size: Size) {
  document.documentElement.setAttribute('data-reading-size', size)
}

const READING_SIZE_EVENT = 'nw:reading-size-change'

/**
 * The chosen reading size is browser state (a stored preference reflected on
 * <html>), read through an external store so the server snapshot is always
 * `base` and the client snapshot is the reader's real choice.
 */
const readingSizeStore = createBrowserStore<Size>({
  read: readStoredSize,
  serverValue: 'base',
  events: ['storage'],
  customEvents: [READING_SIZE_EVENT],
})

export function FontSizeControl({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const size = useBrowserStore(readingSizeStore)

  // Apply the stored size to <html> after mount. Side effect only, no setState.
  useEffect(() => {
    apply(readStoredSize())
  }, [])

  function choose(next: Size) {
    apply(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore persistence failure
    }
    notifyBrowserStore(READING_SIZE_EVENT)
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
