'use client'

import { useEffect, useRef } from 'react'
import type { AdMode } from '@/lib/ads'
import { hasAdvertisingConsent } from '@/lib/reader/consent'
import { attentionScore } from '@/lib/ads/attention'

const VIEWABILITY_THRESHOLD = 0.5

export function AdTracker({ placementKey, mode }: { placementKey: string; mode: AdMode }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const fired = useRef(false)

  useEffect(() => {
    const node = ref.current?.closest('[data-ad-placement]')
    if (!node || fired.current) return
    if (!hasAdvertisingConsent()) return

    let viewableSinceMs: number | null = null
    let dwellMs = 0
    let hiddenWhileViewable = false
    let latestRatio = 0

    function trackVisibilityChange() {
      if (viewableSinceMs === null) return
      dwellMs += Date.now() - viewableSinceMs
      viewableSinceMs = document.visibilityState === 'visible' ? Date.now() : null
      if (document.visibilityState !== 'visible') hiddenWhileViewable = true
    }

    const send = () => {
      if (fired.current) return
      fired.current = true
      if (viewableSinceMs !== null) dwellMs += Date.now() - viewableSinceMs
      const attention = attentionScore({
        viewableRatio: latestRatio,
        dwellMs,
        tabVisible: !hiddenWhileViewable,
      })
      const payload = JSON.stringify({ placementKey, mode, event: 'impression', attention })
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/ads/event', new Blob([payload], { type: 'application/json' }))
        return
      }
      fetch('/api/ads/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => undefined)
    }

    if (!('IntersectionObserver' in window)) {
      send()
      return
    }

    document.addEventListener('visibilitychange', trackVisibilityChange)

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        latestRatio = Math.max(latestRatio, entry.intersectionRatio)
        const viewableNow = entry.isIntersecting && entry.intersectionRatio >= VIEWABILITY_THRESHOLD
        if (viewableNow && viewableSinceMs === null) {
          viewableSinceMs = Date.now()
        } else if (!viewableNow && viewableSinceMs !== null) {
          dwellMs += Date.now() - viewableSinceMs
          viewableSinceMs = null
        }
        if (viewableNow) {
          send()
          observer.disconnect()
        }
      },
      { threshold: [0, VIEWABILITY_THRESHOLD, 1] },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', trackVisibilityChange)
    }
  }, [mode, placementKey])

  return <span ref={ref} hidden />
}
