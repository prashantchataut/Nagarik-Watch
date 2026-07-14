export const dynamic = 'force-static'

const worker = `
const CACHE_NAME = 'nagarik-watch-shell-v2'
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icon.svg', '/apple-icon.png']

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

function safePublicPath(value) {
  try {
    const url = new URL(String(value || '/'), self.location.origin)
    if (url.origin !== self.location.origin) return '/'
    if (/^\\/(api|admin|journalist|auth)(\\/|$)/.test(url.pathname)) return '/'
    if (/^\\/(en\\/)?(auth|journalist)(\\/|$)/.test(url.pathname)) return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Never cache APIs, account pages, newsroom surfaces, or personalized desks.
  if (
    url.pathname.startsWith('/api/') ||
    /^\\/(admin|journalist|auth)(\\/|$)/.test(url.pathname) ||
    /^\\/(en\\/)?(auth|journalist|reader-corner|saved)(\\/|$)/.test(url.pathname)
  ) return

  // Static shell assets use cache-first. Public navigation stays network-first
  // and falls back only to the neutral homepage shell when offline.
  if (request.destination === 'manifest' || request.destination === 'image') {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
    return
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
  }
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }
  const title = String(payload.title || 'Nagarik Watch').slice(0, 120)
  const body = String(payload.body || 'नयाँ सूचना उपलब्ध छ।').slice(0, 280)
  const url = safePublicPath(payload.url)
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: String(payload.tag || url).slice(0, 180),
      renotify: Boolean(payload.renotify),
      data: { url },
      icon: '/apple-icon.png',
      badge: '/apple-icon.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = safePublicPath(event.notification.data && event.notification.data.url)
  event.waitUntil((async () => {
    const targetUrl = new URL(target, self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue
      if ('navigate' in client) await client.navigate(targetUrl)
      if ('focus' in client) return client.focus()
    }
    return self.clients.openWindow(targetUrl)
  })())
})
`

export function GET() {
  return new Response(worker, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Service-Worker-Allowed': '/',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
