'use client'

import { useEffect } from 'react'
import { InstallPrompt } from '@/components/InstallPrompt'

const CHUNK_RELOAD_KEY = 'nw-chunk-reload'

function isChunkLoadFailure(value: unknown): boolean {
  if (!value) return false
  if (typeof value === 'string') {
    return /ChunkLoadError|Loading chunk [\w.-]+ failed|Failed to fetch dynamically imported module/i.test(
      value,
    )
  }
  if (value instanceof Error) {
    return isChunkLoadFailure(value.name) || isChunkLoadFailure(value.message)
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return isChunkLoadFailure(String((value as { message: unknown }).message))
  }
  return false
}

async function recoverFromStaleBuild() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  } catch {
    /* private mode */
  }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((reg) => reg.update().catch(() => undefined)))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key.startsWith('nagarik-watch-')).map((key) => caches.delete(key)),
      )
    }
  } catch {
    /* best effort */
  }

  window.location.reload()
}

export function PwaBoot() {
  useEffect(() => {
    // Healthy boot clears the one-shot guard so a later deploy can recover again.
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      } catch {
        /* private mode */
      }
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'development') return

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadFailure(event.error) || isChunkLoadFailure(event.message)) {
        void recoverFromStaleBuild()
      }
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        void recoverFromStaleBuild()
      }
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return <InstallPrompt />
}
