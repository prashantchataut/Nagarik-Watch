'use client'

import { useEffect, useRef, useState } from 'react'
import { hasAdvertisingConsent } from '@/lib/reader/consent'

type Googletag = {
  cmd: Array<() => void>
  defineSlot: (
    path: string,
    size: [number, number],
    id: string,
  ) => { addService: (svc: unknown) => unknown } | null
  pubads: () => unknown
  enableServices: () => void
  display: (id: string) => void
}

type AdsByGoogle = {
  push: (config: Record<string, unknown>) => number
  loaded?: boolean
}

/**
 * Renders a real AdSense or GAM slot only when credentials exist and the reader
 * has granted advertising consent. Otherwise null so parents can collapse.
 */
export function NetworkAdUnit({
  network,
  adsenseClient,
  adsenseSlot,
  gamPath,
  width,
  height,
}: {
  network: string
  adsenseClient?: string
  adsenseSlot?: string
  gamPath?: string
  width: number
  height: number
}) {
  const gamRef = useRef<HTMLDivElement>(null)
  const adsenseRef = useRef<HTMLModElement>(null)
  const pushed = useRef(false)
  const [consentAds, setConsentAds] = useState(false)
  const kind = network.trim().toLowerCase()

  useEffect(() => {
    setConsentAds(hasAdvertisingConsent())
  }, [])

  useEffect(() => {
    if (!consentAds || kind !== 'gam' || !gamPath?.trim() || !gamRef.current) return
    const w = window as Window & { googletag?: Partial<Googletag> }
    const id = gamRef.current.id
    if (!w.googletag) w.googletag = { cmd: [] }
    if (!Array.isArray(w.googletag.cmd)) w.googletag.cmd = []
    w.googletag.cmd.push(() => {
      const googletag = w.googletag as Googletag | undefined
      if (!googletag?.defineSlot || !googletag.pubads || !googletag.enableServices || !googletag.display) {
        return
      }
      const slot = googletag.defineSlot(gamPath.trim(), [width, height], id)
      if (slot) {
        slot.addService(googletag.pubads())
        googletag.enableServices()
        googletag.display(id)
      }
    })
  }, [consentAds, kind, gamPath, width, height])

  useEffect(() => {
    if (!consentAds || kind !== 'adsense') return
    if (!adsenseClient?.trim() || !adsenseSlot?.trim()) return
    if (pushed.current) return

    let attempts = 0
    const timer = window.setInterval(() => {
      attempts += 1
      const w = window as Window & { adsbygoogle?: AdsByGoogle | unknown[] }
      if (!Array.isArray(w.adsbygoogle)) {
        w.adsbygoogle = []
      }
      // Script present or queue ready — push once so AdSense can fill the <ins>.
      const scriptReady =
        Boolean(document.getElementById('nw-adsense')) ||
        (typeof (w.adsbygoogle as AdsByGoogle).loaded === 'boolean'
          ? Boolean((w.adsbygoogle as AdsByGoogle).loaded)
          : attempts >= 2)
      if (!scriptReady && attempts < 40) return
      try {
        ;(w.adsbygoogle as AdsByGoogle).push({})
        pushed.current = true
      } catch {
        // Ignore double-push / race errors from the AdSense loader.
      }
      window.clearInterval(timer)
    }, 250)

    return () => window.clearInterval(timer)
  }, [consentAds, kind, adsenseClient, adsenseSlot])

  if (!consentAds) return null

  if (kind === 'adsense' && adsenseClient?.trim() && adsenseSlot?.trim()) {
    return (
      <ins
        ref={adsenseRef}
        className="adsbygoogle"
        style={{ display: 'block', width, minHeight: height }}
        data-ad-client={adsenseClient.trim()}
        data-ad-slot={adsenseSlot.trim()}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    )
  }

  if (kind === 'gam' && gamPath?.trim()) {
    return (
      <div
        ref={gamRef}
        id={`nw-gam-${gamPath.replace(/[^\w-]+/g, '-')}-${width}x${height}`}
        style={{ width, minHeight: height }}
      />
    )
  }

  return null
}
