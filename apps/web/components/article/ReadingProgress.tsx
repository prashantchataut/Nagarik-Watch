'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'

/**
 * Thin progress bar pinned to the viewport top. When `targetId` is set, progress tracks
 * that column instead of the full page so related stories and footer do not inflate the bar.
 */
export function ReadingProgress({
  locale,
  targetId,
}: {
  locale: Locale
  targetId?: string
}) {
  const dict = getDictionary(locale)
  const fillRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const compute = () => {
      frame = 0
      let pct = 0
      const target = targetId ? document.getElementById(targetId) : null
      if (target) {
        const rect = target.getBoundingClientRect()
        const top = window.scrollY + rect.top
        const height = target.scrollHeight
        const scrollable = height - window.innerHeight
        if (scrollable <= 0) {
          pct = window.scrollY >= top ? 1 : 0
        } else {
          pct = (window.scrollY - top) / scrollable
        }
      } else {
        const max = document.documentElement.scrollHeight - document.documentElement.clientHeight
        pct = max > 0 ? window.scrollY / max : 0
      }
      pct = Math.min(1, Math.max(0, pct))
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
  }, [targetId])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1"
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
