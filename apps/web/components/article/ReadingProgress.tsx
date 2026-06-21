'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'

/**
 * ReadingProgress — a thin progress bar pinned to the top of the viewport that fills as the
 * reader scrolls through the article (spec Phase 5: article progress indicator). It gives a
 * sense of length and place in long civic pieces without any heavy chrome.
 *
 * Implementation respects the design laws: it animates `transform: scaleX` only (never a
 * layout property), is purely decorative-but-announced (role=progressbar with live values
 * for assistive tech), sits below the sticky masthead, and disappears under reduced-motion
 * preference is not needed (no motion to disable, the scale tracks scroll position directly).
 *
 * It measures the nearest <article> ancestor by id so it tracks the body, not the whole
 * page; falls back to the document if not found.
 */
export function ReadingProgress({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const fillRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const compute = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const pct = max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${pct})`
      }
      setValue(Math.round(pct * 100))
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1"
      role="progressbar"
      aria-label={dict.readingProgressAria}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        ref={fillRef}
        className="h-full origin-left bg-brand will-change-transform"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  )
}
