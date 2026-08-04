'use client'

import { getAdModeClient } from '@/lib/ads-client'
import { hasAdvertisingConsent } from '@/lib/reader/consent'
import { hasLivePublicApi } from '@/lib/runtime/public-api'
import { getOrCreateReaderId, hasPersonalizationConsent } from '@/lib/reader/consent'

function visitorKey(): string {
  if (hasPersonalizationConsent()) {
    const id = getOrCreateReaderId()
    if (id) return id
  }
  try {
    let id = sessionStorage.getItem('nw_ad_visitor')
    if (!id) {
      id = `adv-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
      sessionStorage.setItem('nw_ad_visitor', id)
    }
    return id
  } catch {
    return `adv-${Date.now()}`
  }
}

function recordHouseClickEvent(placementKey: string): void {
  if (!hasLivePublicApi()) return
  if (!hasAdvertisingConsent()) return
  const payload = JSON.stringify({
    placementKey,
    mode: getAdModeClient(),
    event: 'click',
  })
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/ads/event', new Blob([payload], { type: 'application/json' }))
      return
    }
  } catch {
    // fall through to fetch
  }
  void fetch('/api/ads/event', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => undefined)
}

/** Record house-ad experiment conversion (click) via existing experiments API. */
export function trackHouseAdClick(experimentId: string | undefined, placementKey?: string): void {
  if (placementKey) recordHouseClickEvent(placementKey)
  if (!experimentId || !hasLivePublicApi()) return
  if (!hasAdvertisingConsent()) return
  void fetch('/api/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      experimentId,
      visitorKey: visitorKey(),
      eventType: 'conversion',
    }),
    keepalive: true,
  }).catch(() => undefined)
}

export function HouseAdLink({
  href,
  className,
  experimentId,
  placementKey,
  children,
}: {
  href: string
  className?: string
  experimentId?: string
  placementKey: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={className}
      data-ad-click-target={placementKey}
      onClick={() => trackHouseAdClick(experimentId, placementKey)}
    >
      {children}
    </a>
  )
}
