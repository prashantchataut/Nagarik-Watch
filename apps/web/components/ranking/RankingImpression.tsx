'use client'

import { useEffect, useRef } from 'react'
import { hasAnalyticsConsent, hasPersonalizationConsent } from '@/lib/reader/consent'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

/**
 * Fires a one-shot first-party ranking impression when ≥40% of the card is visible.
 * Requires analytics or personalisation consent.
 */
export function RankingImpression({
  articleSlug,
  articleCategory,
}: {
  articleSlug: string
  articleCategory: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const sent = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node || sent.current) return
    if (!hasAnalyticsConsent() && !hasPersonalizationConsent()) return
    if (!hasLivePublicApi()) return

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.4)
        if (!hit || sent.current) return
        sent.current = true
        observer.disconnect()
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
    return () => observer.disconnect()
  }, [articleCategory, articleSlug])

  return <span ref={ref} className="sr-only" aria-hidden="true" data-ranking-impression={articleSlug} />
}

export function trackRankingClick(articleSlug: string, articleCategory: string) {
  if (typeof window === 'undefined') return
  if (!hasLivePublicApi()) return
  if (!hasAnalyticsConsent() && !hasPersonalizationConsent()) return
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
  if (!hasAnalyticsConsent() && !hasPersonalizationConsent()) return
  void fetch('/api/ranking-events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'share', articleSlug, articleCategory }),
    keepalive: true,
  }).catch(() => undefined)
}
