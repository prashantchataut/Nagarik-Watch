'use client'

import Script from 'next/script'
import { useHydrated } from '@/lib/browser/use-browser-store'
import { hasAdvertisingCookieConsent } from '@/lib/reader/consent'

type Network = 'adsense' | 'gam' | ''

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
  // The consent cookie is unreadable during SSR. Gating on hydration keeps the
  // server and first client render identical without a mount effect.
  const hydrated = useHydrated()
  const consentAds = hydrated && hasAdvertisingCookieConsent()

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
