'use client'

import { useEffect, useRef } from 'react'
import type { AdMode } from '@/lib/ads'
import { hasAdvertisingConsent } from '@/lib/reader/consent'

export function AdTracker({ placementKey, mode }: { placementKey: string; mode: AdMode }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const fired = useRef(false)

  useEffect(() => {
    const node = ref.current?.closest('[data-ad-placement]')
    if (!node || fired.current) return
    if (!hasAdvertisingConsent()) return

    const send = () => {
      if (fired.current) return
      fired.current = true
      const payload = JSON.stringify({ placementKey, mode, event: 'impression' })
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

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
          send()
          observer.disconnect()
        }
      },
      { threshold: [0.5] },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [mode, placementKey])

  return <span ref={ref} hidden />
}
