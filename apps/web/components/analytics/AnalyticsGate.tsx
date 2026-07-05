'use client'

import { useEffect } from 'react'
import { CONSENT_EVENT, hasAnalyticsConsent } from '@/lib/reader/consent'

export function AnalyticsGate({ domain, src }: { domain?: string; src: string }) {
  useEffect(() => {
    if (!domain) return

    function inject() {
      if (!hasAnalyticsConsent()) return
      if (document.querySelector('script[data-nw-analytics="plausible"]')) return

      const script = document.createElement('script')
      script.defer = true
      script.src = src
      script.dataset.domain = domain
      script.dataset.nwAnalytics = 'plausible'
      document.head.appendChild(script)
    }

    inject()
    window.addEventListener(CONSENT_EVENT, inject)
    return () => window.removeEventListener(CONSENT_EVENT, inject)
  }, [domain, src])

  return null
}
