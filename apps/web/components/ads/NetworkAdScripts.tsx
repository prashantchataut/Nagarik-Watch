'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

type Network = 'adsense' | 'gam' | ''

/**
 * Loads third-party ad scripts only when mode=network and the matching
 * publisher id is present. Never injects placeholders as filled inventory.
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
  const [consentAds, setConsentAds] = useState(false)

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )nw_consent=([^;]+)/)
      if (!match?.[1]) return
      const parsed = JSON.parse(decodeURIComponent(match[1])) as { advertising?: boolean }
      setConsentAds(Boolean(parsed.advertising))
    } catch {
      setConsentAds(false)
    }
  }, [])

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
