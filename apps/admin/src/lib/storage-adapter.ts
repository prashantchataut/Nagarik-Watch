/**
 * STORAGE_*, S3_* and BLOB_* variables are credentials, not an adapter.
 * Keep false until payload.config.ts imports and configures a real Payload
 * storage plugin (for example an S3-compatible or Vercel Blob plugin).
 */
export const STORAGE_ADAPTER_WIRED = false

export function isPayloadStorageWired(): boolean {
  return STORAGE_ADAPTER_WIRED
}
