import {
  ARTICLE_CACHE_LIMIT,
  ARTICLE_CACHE_NAME,
  CURRENT_OFFLINE_CACHE_NAMES,
  IMAGE_CACHE_LIMIT,
  IMAGE_CACHE_NAME,
  SHELL_CACHE_NAME,
  SHELL_PRECACHE_URLS,
  buildOfflineWorkerHelpersSource,
} from '@/lib/pwa/offline-cache'

export const dynamic = 'force-static'

const worker = `
const SHELL_CACHE_NAME = ${JSON.stringify(SHELL_CACHE_NAME)}
const ARTICLE_CACHE_NAME = ${JSON.stringify(ARTICLE_CACHE_NAME)}
const IMAGE_CACHE_NAME = ${JSON.stringify(IMAGE_CACHE_NAME)}
const CURRENT_OFFLINE_CACHE_NAMES = ${JSON.stringify([...CURRENT_OFFLINE_CACHE_NAMES])}
const SHELL_PRECACHE_URLS = ${JSON.stringify([...SHELL_PRECACHE_URLS])}
const ARTICLE_CACHE_LIMIT = ${ARTICLE_CACHE_LIMIT}
const IMAGE_CACHE_LIMIT = ${IMAGE_CACHE_LIMIT}

${buildOfflineWorkerHelpersSource()}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => cache.addAll(SHELL_PRECACHE_URLS)).catch(() => undefined)
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !CURRENT_OFFLINE_CACHE_NAMES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

function safePublicPath(value) {
  try {
    const url = new URL(String(value || '/'), self.location.origin)
    if (url.origin !== self.location.origin) return '/'
    if (isOfflineExcludedPath(url.pathname)) return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}

function responseCacheMeta(response) {
  return {
    ok: response.ok,
    status: response.status,
    type: response.type,
    cacheControl: response.headers.get('Cache-Control'),
  }
}

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  const urls = keys.map((request) => request.url)
  const toDelete = selectKeysToDelete(urls, limit)
  await Promise.all(toDelete.map((url) => cache.delete(url)))
}

async function putIfCacheable(cacheName, request, response, limit) {
  if (!isOfflineCacheableResponse(responseCacheMeta(response))) return
  const cache = await caches.open(cacheName)
  await cache.put(request, response.clone())
  await trimCache(cacheName, limit)
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cached = await caches.match(request, { cacheName: cacheName })
  const networkPromise = fetch(request).then(async (response) => {
    await putIfCacheable(cacheName, request, response, limit)
    return response
  })

  if (cached) {
    networkPromise.catch(() => undefined)
    return cached
  }

  return networkPromise
}

async function handleArticleNavigation(request) {
  const cached = await caches.match(request, { cacheName: ARTICLE_CACHE_NAME })

  const networkPromise = fetch(request).then(async (response) => {
    await putIfCacheable(ARTICLE_CACHE_NAME, request, response, ARTICLE_CACHE_LIMIT)
    return response
  })

  if (cached) {
    networkPromise.catch(() => undefined)
    return cached
  }

  try {
    return await networkPromise
  } catch {
    const shell = await caches.match('/')
    if (shell) return shell
    throw new TypeError('Network unavailable and no offline shell cached')
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isOfflineExcludedPath(url.pathname)) return

  if (request.destination === 'manifest' || SHELL_PRECACHE_URLS.indexOf(url.pathname) !== -1) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then(async (response) => {
          if (isOfflineCacheableResponse(responseCacheMeta(response))) {
            const cache = await caches.open(SHELL_CACHE_NAME)
            await cache.put(request, response.clone())
          }
          return response
        })
      })
    )
    return
  }

  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE_NAME, IMAGE_CACHE_LIMIT))
    return
  }

  if (request.mode === 'navigate' && isPublicArticleNavigationPath(url.pathname)) {
    event.respondWith(handleArticleNavigation(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match('/')
        if (shell) return shell
        throw new TypeError('Network unavailable and no offline shell cached')
      })
    )
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
