'use client'

import { useEffect, useRef, useState } from 'react'
import {
  getOrCreateReaderId,
  hasAnalyticsConsent,
  hasPersonalizationConsent,
} from '@/lib/reader/consent'
import { hasLivePublicApi } from '@/lib/runtime/public-api'

const SESSION_VISITOR_KEY = 'nw_experiment_visitor'

function experimentVisitorKey(): string {
  if (typeof window === 'undefined') return ''
  if (hasPersonalizationConsent()) {
    const readerId = getOrCreateReaderId()
    if (readerId) return readerId
  }
  if (!hasAnalyticsConsent()) return ''
  try {
    let key = window.sessionStorage.getItem(SESSION_VISITOR_KEY)
    if (!key) {
      key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? `exp-${crypto.randomUUID()}`
          : `exp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      window.sessionStorage.setItem(SESSION_VISITOR_KEY, key)
    }
    return key
  } catch {
    return ''
  }
}

async function postExperimentEvent(
  experimentId: string,
  eventType: 'exposure' | 'conversion',
): Promise<string | null> {
  const visitorKey = experimentVisitorKey()
  if (!visitorKey || !experimentId) return null
  if (!hasLivePublicApi()) return null
  try {
    const response = await fetch('/api/experiments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ experimentId, visitorKey, eventType }),
      keepalive: true,
    })
    if (!response.ok) return null
    const data = (await response.json()) as { variantId?: string }
    return data.variantId ?? null
  } catch {
    return null
  }
}

/** Records a consented exposure and exposes the assigned variant for layout tests. */
export function ExperimentExposure({
  experimentId,
  onVariant,
}: {
  experimentId: string
  onVariant?: (variantId: string | null) => void
}) {
  const [variantId, setVariantId] = useState<string | null>(null)
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current || !experimentId.trim()) return
    if (!hasAnalyticsConsent() && !hasPersonalizationConsent()) {
      onVariant?.(null)
      return
    }
    sent.current = true
    void postExperimentEvent(experimentId, 'exposure').then((assigned) => {
      setVariantId(assigned)
      onVariant?.(assigned)
    })
  }, [experimentId, onVariant])

  if (!variantId) return null
  return <span className="sr-only" data-experiment={experimentId} data-variant={variantId} />
}

/** Fire a conversion once (e.g. article completion) for an active experiment. */
export function trackExperimentConversion(experimentId: string): void {
  if (typeof window === 'undefined' || !experimentId.trim()) return
  if (!hasAnalyticsConsent() && !hasPersonalizationConsent()) return
  void postExperimentEvent(experimentId, 'conversion')
}

export const ARTICLE_COMPLETION_EXPERIMENT_ID = 'article-completion-v1'

export { HOME_LAYOUT_EXPERIMENT_ID } from '@/lib/experiments/home-layout-shared'
