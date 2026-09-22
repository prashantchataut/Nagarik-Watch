'use client'

import Script from 'next/script'
import { useClientValue } from '@/lib/browser/use-client-state'

type Network = 'adsense' | 'gam' | ''

/** Advertising consent as recorded in the `nw_consent` cookie. */
function cookieAdConsent(): boolean {
  try {
    const match = document.cookie.match(/(?:^|; )nw_consent=([^;]+)/)
    if (!match?.[1]) return false
    const parsed = JSON.parse(decodeURIComponent(match[1])) as { advertising?: boolean }
    return Boolean(parsed.advertising)
  } catch {
    return false
  }
}

/**
 * Loads third-party ad scripts only when mode=network and the matching
 * publisher id is present. Never treats an empty network response as filled inventory.
 */
export function NetworkAdScripts({
  mode,
  network,
  adsenseClient,
  gamNetworkCode,
}: {
  mode: string
  network: string
  adsenseClient?: string
  gamNetworkCode?: string
}) {
  // No consent in the prerender: third-party ad scripts never ship in static HTML.
  const consentAds = useClientValue(cookieAdConsent, false)

  if (mode !== 'network' || !consentAds) return null

  const kind = (network.trim().toLowerCase() || '') as Network
  if (kind === 'adsense' && adsenseClient?.trim()) {
    return (
      <Script
        id="nw-adsense"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient.trim())}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    )
  }

  if (kind === 'gam' && gamNetworkCode?.trim()) {
    return (
      <Script
        id="nw-gam"
        async
        src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
        strategy="afterInteractive"
      />
    )
  }

  return null
}
