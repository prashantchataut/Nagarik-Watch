import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

const isCloudflareWorkers = process.env.CF_WORKERS === '1'

/**
 * OpenNext Cloudflare adapter for Nagarik Watch.
 * CF_WORKERS=1 uses static-assets ISR (smaller worker) for the free 3 MiB plan.
 */
export default defineCloudflareConfig({
  incrementalCache: isCloudflareWorkers ? staticAssetsIncrementalCache : kvIncrementalCache,
  ...(isCloudflareWorkers ? { enableCacheInterception: true } : {}),
})
