'use client'

import { type ReactNode } from 'react'
import { hasAdvertisingConsent } from '@/lib/reader/consent'
import { useClientValue } from '@/lib/browser/use-client-state'

/**
 * Renders children only after the reader grants advertising consent.
 * Used to avoid empty labelled network shells before scripts may load.
 */
export function ConsentGatedAd({ children }: { children: ReactNode }) {
  // Server-side `false` keeps the prerender free of ad shells, which is also
  // what a reader who has not consented should see after hydration.
  const allowed = useClientValue(hasAdvertisingConsent, false)

  if (!allowed) return null
  return children
}
