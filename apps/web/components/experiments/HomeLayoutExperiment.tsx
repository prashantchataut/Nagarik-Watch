'use client'

import { useCallback } from 'react'
import { ExperimentExposure } from '@/components/experiments/ExperimentExposure'
import {
  HOME_LAYOUT_COOKIE,
  HOME_LAYOUT_EXPERIMENT_ID,
  HOME_LAYOUT_VISITOR_COOKIE,
} from '@/lib/experiments/home-layout-shared'

function writeCookie(name: string, value: string, days = 30) {
  try {
    const maxAge = days * 24 * 60 * 60
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
  } catch {
    /* ignore */
  }
}

/**
 * Records home-layout experiment exposure and persists the variant in a cookie
 * so the next SSR pass can space featured bands without a layout flash.
 */
export function HomeLayoutExperiment() {
  const onVariant = useCallback((variantId: string | null) => {
    if (!variantId) return
    writeCookie(HOME_LAYOUT_COOKIE, variantId)
    try {
      const existing = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${HOME_LAYOUT_VISITOR_COOKIE}=`))
      if (!existing) {
        const key =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? `exp-${crypto.randomUUID()}`
            : `exp-${Date.now()}`
        writeCookie(HOME_LAYOUT_VISITOR_COOKIE, key)
      }
    } catch {
      /* ignore */
    }
  }, [])

  return <ExperimentExposure experimentId={HOME_LAYOUT_EXPERIMENT_ID} onVariant={onVariant} />
}
