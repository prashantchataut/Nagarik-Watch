'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { hasAdvertisingConsent } from '@/lib/reader/consent'

/**
 * Renders children only after the reader grants advertising consent.
 * Used to avoid empty labelled network shells before scripts may load.
 */
export function ConsentGatedAd({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    setAllowed(hasAdvertisingConsent())
  }, [])

  if (!allowed) return null
  return children
}
