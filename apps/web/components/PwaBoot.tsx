'use client'

import { useEffect } from 'react'
import { InstallPrompt } from '@/components/InstallPrompt'

export function PwaBoot() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development') return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
  }, [])

  return <InstallPrompt />
}
