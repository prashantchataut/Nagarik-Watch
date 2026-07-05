'use client'

import { useEffect } from 'react'

const CONSENT_KEY = 'nw-cookie-consent-v2'

type ConsentShape = {
  essential: true
  analytics: boolean
  decidedAt: string
}

function readConsent(): ConsentShape | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return raw ? (JSON.parse(raw) as ConsentShape) : null
  } catch {
    return null
  }
}

export function AnalyticsGate({ domain, src }: { domain?: string; src: string }) {
  useEffect(() => {
    if (!domain) return

    function inject() {
      const consent = readConsent()
      if (!consent?.analytics) return
      if (document.querySelector('script[data-nw-analytics="plausible"]')) return

      const script = document.createElement('script')
      script.defer = true
      script.src = src
      script.dataset.domain = domain
      script.dataset.nwAnalytics = 'plausible'
      document.head.appendChild(script)
    }

    inject()
    window.addEventListener('nw-cookie-consent-change', inject)
    return () => window.removeEventListener('nw-cookie-consent-change', inject)
  }, [domain, src])

  return null
}
