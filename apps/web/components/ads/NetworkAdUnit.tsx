'use client'

import { useEffect, useRef } from 'react'

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

/**
 * Renders a real AdSense or GAM slot when credentials exist; otherwise null
 * so the parent can keep the reserved labelled container.
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
  const kind = network.trim().toLowerCase()

  useEffect(() => {
    if (kind !== 'gam' || !gamPath?.trim() || !gamRef.current) return
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
  }, [kind, gamPath, width, height])

  if (kind === 'adsense' && adsenseClient?.trim() && adsenseSlot?.trim()) {
    return (
      <ins
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
