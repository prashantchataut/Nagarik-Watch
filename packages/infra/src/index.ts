/**
 * Adapter factory. The app imports `edge` and `storage` singletons; the concrete
 * implementation is chosen from env here, keeping provider code out of business logic.
 *
 * To add a provider: create `src/adapters/<provider>.ts`, register it in the maps below.
 * Default is Cloudflare (ADR-003); the seam makes it swappable.
 */

import { loadEnv } from '@nagarikwatch/db/env'
import { noopEdgeAdapter, type EdgeAdapter } from './edge'
import { noopStorageAdapter, type StorageAdapter } from './storage'

export * from './edge'
export * from './storage'

// --- Edge adapters ---------------------------------------------------------

const cloudflareEdge: EdgeAdapter = {
  provider: 'cloudflare',
  async purge(req) {
    // Implementation lands when EDGE_API_TOKEN + EDGE_ZONE_ID are wired (Phase 1 deploy).
    // Documented here as the seam; throws if called unconfigured so it's never silently a no-op in prod.
    const token = process.env.EDGE_API_TOKEN
    const zone = process.env.EDGE_ZONE_ID
    if (!token || !zone) {
      throw new Error('cloudflareEdge.purge called without EDGE_API_TOKEN/EDGE_ZONE_ID')
    }
    // TODO(Phase 1): POST https://api.cloudflare.com/client/v4/zones/{zone}/cache/purge
    // with { files, purge_everything, (tags via Enterprise) }. Idempotent.
    void req
  },
}

// `none` maps to the SAME singleton exported from ./edge.ts, so getEdge() and the
// imported noopEdgeAdapter are referentially identical.
const edgeAdapters: Record<string, EdgeAdapter> = {
  none: noopEdgeAdapter,
  cloudflare: cloudflareEdge,
  aws: { provider: 'aws', async purge() {} }, // stub — implement in adapters/aws.ts
  bunny: { provider: 'bunny', async purge() {} }, // stub — implement in adapters/bunny.ts
}

// --- Storage adapters ------------------------------------------------------

// S3-compatible storage is one implementation pointed at different endpoints (R2/S3/B2/MinIO).
// A single s3Storage factory is built in adapters/s3.ts in Phase 1; here we map `none` to the
// SAME singleton exported from ./storage.ts, so getStorage() === noopStorageAdapter.
const storageAdapters: Record<string, StorageAdapter> = {
  none: noopStorageAdapter,
  // cloudflare / aws / b2 / minio all map to the S3 adapter with different endpoints.
}

function pick<T>(map: Record<string, T>, key: string | undefined, fallback: T): T {
  if (key && key in map) return map[key]!
  return fallback
}

let cachedEdge: EdgeAdapter | undefined
let cachedStorage: StorageAdapter | undefined

/**
 * Lazily resolve the edge adapter. In dev/test (EDGE_PROVIDER=none or unset) returns a
 * no-op. In prod, returns the configured provider's adapter.
 */
export function getEdge(): EdgeAdapter {
  if (cachedEdge) return cachedEdge
  const provider = process.env.EDGE_PROVIDER ?? 'none'
  cachedEdge = pick(edgeAdapters, provider, noopEdgeAdapter)
  return cachedEdge
}

/** Lazily resolve the storage adapter. Falls back to noop if STORAGE_* is unset. */
export function getStorage(): StorageAdapter {
  if (cachedStorage) return cachedStorage
  const hasS3Config = Boolean(process.env.STORAGE_ENDPOINT && process.env.STORAGE_ACCESS_KEY_ID)
  cachedStorage = hasS3Config ? (storageAdapters['s3'] ?? noopStorageAdapter) : noopStorageAdapter
  return cachedStorage
}

/** Test-only: reset cached singletons between tests if env changes. */
export function _resetAdaptersForTest(): void {
  cachedEdge = undefined
  cachedStorage = undefined
}

// NOTE: env is validated lazily by @nagarikwatch/db/env (Proxy). Apps that need fail-fast
// validation at boot call `loadEnv()` themselves. Do not validate env on import here:
// importing infra should be side-effect-free (tests, tooling, partial deploys).
void loadEnv
