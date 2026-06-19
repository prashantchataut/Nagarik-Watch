/**
 * Object-storage adapter interface (ADR-003).
 *
 * All editorial media (hero images, galleries, ePaper PDFs) is stored and served through
 * `StorageAdapter`. Because every realistic provider (Cloudflare R2, AWS S3, Backblaze B2,
 * MinIO, Bunny) speaks the S3 API, the storage adapter is essentially the S3 surface —
 * the implementation is just "S3 client pointed at different endpoints."
 */

export interface PutMediaInput {
  /** Object key, e.g. 'articles/2026/06/slug/hero.webp'. */
  key: string
  /** File contents. */
  body: Buffer | Uint8Array | ReadableStream
  contentType: string
  /** Disable CDN/public caching (rare; e.g. draft-only media). */
  private?: boolean
  /** Optional content SHA-256 for integrity checks. */
  checksumSha256?: string
}

export interface StoredMedia {
  key: string
  /** Public URL (or signed URL for private objects) the CDN serves. */
  url: string
  size: number
  contentType: string
}

export interface StorageAdapter {
  readonly provider: string
  /** Upload media. Overwrites if the key exists. */
  put(input: PutMediaInput): Promise<StoredMedia>
  /** Resolve a key to a servable URL (with transforms if the provider supports them). */
  getUrl(key: string, opts?: { width?: number; format?: 'webp' | 'avif' | 'auto' }): string
  /** Remove media. Idempotent: deleting a missing key is not an error. */
  delete(key: string): Promise<void>
}

/**
 * No-op storage adapter for dev/test. Returns a synthetic URL so the UI can render
 * without a real bucket. Replace via `createStorage()` when STORAGE_* env is set.
 */
export const noopStorageAdapter: StorageAdapter = {
  provider: 'none',
  async put({ key, contentType }) {
    return { key, url: `memory://${key}`, size: 0, contentType }
  },
  getUrl(key) {
    return `memory://${key}`
  },
  async delete() {
    /* no-op */
  },
}
