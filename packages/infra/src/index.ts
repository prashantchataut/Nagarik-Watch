/**
 * Runtime infrastructure adapters. Provider-specific behavior stays behind
 * the small EdgeAdapter / StorageAdapter contracts so publishing code does not
 * spread vendor API details across the monorepo.
 */

import { loadEnv } from '@nagarikwatch/db/env'
import { noopEdgeAdapter, type EdgeAdapter, type PurgeRequest } from './edge'
import { noopStorageAdapter, type StorageAdapter } from './storage'

export * from './edge'
export * from './storage'

function absolutePurgeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL is required to purge relative Cloudflare URLs')
  }
  return `${siteUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

function cloudflareBody(req: PurgeRequest): Record<string, unknown> | null {
  if (req.everything) return { purge_everything: true }
  if (req.tags?.length) return { tags: [...new Set(req.tags)].slice(0, 30) }
  if (req.urls?.length) return { files: [...new Set(req.urls.map(absolutePurgeUrl))].slice(0, 30) }
  return null
}

const cloudflareEdge: EdgeAdapter = {
  provider: 'cloudflare',
  async purge(req) {
    const token = process.env.EDGE_API_TOKEN
    const zone = process.env.EDGE_ZONE_ID
    if (!token || !zone) {
      throw new Error('Cloudflare cache purge requires EDGE_API_TOKEN and EDGE_ZONE_ID')
    }
    const body = cloudflareBody(req)
    if (!body) return
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zone)}/purge_cache`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )
    const raw = await response.text()
    let payload: { success?: boolean; errors?: unknown } | null = null
    if (raw) {
      try {
        payload = JSON.parse(raw) as { success?: boolean; errors?: unknown }
      } catch (error) {
        throw new Error(
          `Cloudflare returned invalid JSON (${response.status}): ${(error as Error).message}`,
        )
      }
    }
    if (!response.ok || payload?.success === false) {
      throw new Error(`Cloudflare cache purge failed (${response.status}): ${raw.slice(0, 500)}`)
    }
  },
  cacheHeaderFor(routeType) {
    if (routeType === 'article' || routeType === 'static')
      return 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
    return 'public, max-age=0, s-maxage=60, stale-while-revalidate=600'
  },
}

const edgeAdapters: Record<string, EdgeAdapter> = {
  none: noopEdgeAdapter,
  cloudflare: cloudflareEdge,
}

let cachedEdge: EdgeAdapter | undefined
let cachedStorage: StorageAdapter | undefined

export function getEdge(): EdgeAdapter {
  if (cachedEdge) return cachedEdge
  const provider = process.env.EDGE_PROVIDER ?? 'none'
  const adapter = edgeAdapters[provider]
  if (!adapter) throw new Error(`Unsupported EDGE_PROVIDER: ${provider}`)
  cachedEdge = adapter
  return cachedEdge
}

/**
 * Editorial media is currently owned by Payload's storage integration. This
 * package exposes a no-op only when storage is deliberately unconfigured; it
 * fails loudly if partial S3 credentials suggest uploads were expected here.
 */
export function getStorage(): StorageAdapter {
  if (cachedStorage) return cachedStorage
  const configured = Boolean(
    process.env.STORAGE_ENDPOINT ||
    process.env.STORAGE_ACCESS_KEY_ID ||
    process.env.STORAGE_SECRET_ACCESS_KEY ||
    process.env.STORAGE_BUCKET,
  )
  if (configured) {
    throw new Error(
      'S3-compatible storage credentials are set, but @nagarikwatch/infra has no upload adapter. Configure the Payload storage adapter or remove partial STORAGE_* values.',
    )
  }
  cachedStorage = noopStorageAdapter
  return cachedStorage
}

export function _resetAdaptersForTest(): void {
  cachedEdge = undefined
  cachedStorage = undefined
}

void loadEnv
