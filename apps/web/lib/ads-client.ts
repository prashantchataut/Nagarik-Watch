'use client'

export type ClientAdMode = 'off' | 'house' | 'network'

/** Client-safe ad mode mirror of NEXT_PUBLIC_ADS_MODE (defaults off). */
export function getAdModeClient(): ClientAdMode {
  const value = process.env.NEXT_PUBLIC_ADS_MODE
  if (value === 'house' || value === 'network' || value === 'off') return value
  return 'off'
}
