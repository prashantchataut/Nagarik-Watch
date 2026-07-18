import { hasAnalyticsConsent } from '@/lib/reader/consent'

export type RumMetric = {
  name: 'page-load' | 'lcp' | 'cls'
  value: number
  path: string
}

export interface RumAdapter {
  readonly kind: 'noop' | 'beacon'
  send(metric: RumMetric): void
}

const noopAdapter: RumAdapter = {
  kind: 'noop',
  send() {},
}

const beaconAdapter: RumAdapter = {
  kind: 'beacon',
  send(metric) {
    if (!hasAnalyticsConsent()) return
    const payload = JSON.stringify(metric)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/rum', new Blob([payload], { type: 'application/json' }))
      return
    }
    void fetch('/api/rum', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  },
}

export function getRumAdapter(): RumAdapter {
  return process.env.NEXT_PUBLIC_RUM_ADAPTER === 'beacon' && hasAnalyticsConsent()
    ? beaconAdapter
    : noopAdapter
}
