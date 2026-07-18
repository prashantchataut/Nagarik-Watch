'use client'

import { useEffect } from 'react'
import { CONSENT_EVENT } from '@/lib/reader/consent'
import { getRumAdapter, type RumMetric } from '@/lib/rum/adapters'

export function RumBoot() {
  useEffect(() => {
    let sent = false

    function report() {
      if (sent) return
      const navigation = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined
      if (!navigation) return
      const metric: RumMetric = {
        name: 'page-load',
        value: Math.max(0, Math.round(navigation.loadEventEnd || navigation.duration)),
        path: window.location.pathname,
      }
      const adapter = getRumAdapter()
      if (adapter.kind === 'noop') return
      adapter.send(metric)
      sent = true
    }

    if (document.readyState === 'complete') report()
    else window.addEventListener('load', report, { once: true })
    window.addEventListener(CONSENT_EVENT, report)
    return () => {
      window.removeEventListener('load', report)
      window.removeEventListener(CONSENT_EVENT, report)
    }
  }, [])

  return null
}
