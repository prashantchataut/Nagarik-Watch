'use client'

import type { ReactNode } from 'react'
import { hasAdvertisingConsent } from '@/lib/reader/consent'
import { useHydrated } from '@/lib/browser/use-browser-store'

/**
 * Renders children only after the reader grants advertising consent.
 * Used to avoid empty labelled network shells before scripts may load.
 *
 * Consent lives in `localStorage`, so it is unknowable during SSR. Gating on
 * `useHydrated()` keeps the server and first client render identical without a
 * mount effect.
 */
export function ConsentGatedAd({ children }: { children: ReactNode }) {
  const hydrated = useHydrated()
  if (!hydrated || !hasAdvertisingConsent()) return null
  return children
}
