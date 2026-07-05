'use client'

import { useEffect } from 'react'

export function PwaBoot() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development') return
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
  }, [])

  return null
}
