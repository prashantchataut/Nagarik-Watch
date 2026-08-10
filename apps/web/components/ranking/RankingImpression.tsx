'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { CONSENT_EVENT, hasAnalyticsConsent, hasPersonalizationConsent } from '@/lib/reader/consent'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

function canTrackRanking(): boolean {
  return hasAnalyticsConsent() || hasPersonalizationConsent()
}

/**
 * Fires a one-shot first-party ranking impression when ≥40% of the card is visible.
 * Requires analytics or personalisation consent. Re-arms after CONSENT_EVENT.
 */
export function RankingImpression({
  articleSlug,
  articleCategory,
  targetRef,
}: {
  articleSlug: string
  articleCategory: string
  /** Layout root to observe (card wrapper). Required — do not observe a 1×1 probe. */
  targetRef: RefObject<HTMLElement | null>
}) {
  const sent = useRef(false)

  useEffect(() => {
    let observer: IntersectionObserver | null = null
    let cancelled = false

    function arm() {
      observer?.disconnect()
      observer = null
      if (cancelled || sent.current) return
      if (!canTrackRanking() || !hasLivePublicApi()) return
      const node = targetRef.current
      if (!node) return

      observer = new IntersectionObserver(
        (entries) => {
          const hit = entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.4,
          )
          if (!hit || sent.current) return
          sent.current = true
          observer?.disconnect()
          void fetch('/api/ranking-events', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              type: 'impression',
              articleSlug,
              articleCategory,
            }),
            keepalive: true,
          }).catch(() => undefined)
        },
        { threshold: [0.4] },
      )
      observer.observe(node)
    }

    function onConsent() {
      arm()
    }

    arm()
    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => {
      cancelled = true
      window.removeEventListener(CONSENT_EVENT, onConsent)
      observer?.disconnect()
    }
  }, [articleCategory, articleSlug, targetRef])

  return null
}

export function trackRankingClick(articleSlug: string, articleCategory: string) {
  if (typeof window === 'undefined') return
  if (!hasLivePublicApi()) return
  if (!canTrackRanking()) return
  void fetch('/api/ranking-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'click', articleSlug, articleCategory }),
    keepalive: true,
  }).catch(() => undefined)
}

export function trackRankingShare(articleSlug: string, articleCategory: string) {
  if (typeof window === 'undefined') return
  if (!hasLivePublicApi()) return
  if (!canTrackRanking()) return
  void fetch('/api/ranking-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'share', articleSlug, articleCategory }),
    keepalive: true,
  }).catch(() => undefined)
}
