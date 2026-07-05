export const dynamic = 'force-static'

const worker = `
const CACHE_NAME = 'nagarik-watch-shell-v1'
const SHELL_URLS = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => undefined))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  if (new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.mode === 'navigate') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined)
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  )
})

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {}
  const title = payload.title || 'Nagarik Watch'
  const body = payload.body || 'नयाँ सूचना उपलब्ध छ।'
  const url = payload.url || '/'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: payload.tag || url,
      data: { url },
      icon: '/icon.png',
      badge: '/icon.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/'
  event.waitUntil(clients.openWindow(url))
})
`

export function GET() {
  return new Response(worker, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
