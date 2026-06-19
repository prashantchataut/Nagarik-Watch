/**
 * Edge/CDN adapter interface (ADR-003).
 *
 * The app talks ONLY to `EdgeAdapter`, never to a specific provider (Cloudflare, AWS
 * CloudFront, Bunny, etc.) directly. The chosen implementation is wired in `index.ts`
 * based on `EDGE_PROVIDER`, and is swappable by changing env + adding one adapter file.
 *
 * Surface is intentionally tiny: purge cached routes on publish, and provide cache
 * headers per route. Anything more provider-specific is opted into deliberately via the
 * adapter, not scattered through app code.
 */

/** A request to purge cached content. Tags let providers purge by grouping (recommended). */
export interface PurgeRequest {
  /** Concrete URLs to invalidate, e.g. ['https://.../politics', '/']. */
  urls?: string[]
  /** Cache-tag groups to invalidate, e.g. ['article:123', 'category:politics']. */
  tags?: string[]
  /** Purge everything (use sparingly — only on global template change). */
  everything?: boolean
}

export interface EdgeAdapter {
  readonly provider: string
  /** Invalidate cached content after a publish. Idempotent: re-purging is a no-op. */
  purge(req: PurgeRequest): Promise<void>
  /** Cache-control header value for a given route type (or undefined to skip). */
  cacheHeaderFor?(routeType: 'home' | 'category' | 'article' | 'static'): string | undefined
}

/** Adapter that does nothing — used in dev/test and when EDGE_PROVIDER=none. */
export const noopEdgeAdapter: EdgeAdapter = {
  provider: 'none',
  async purge() {
    /* no-op */
  },
}
