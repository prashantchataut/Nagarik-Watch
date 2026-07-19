import 'server-only'

/** The canonical Payload app uses the official Vercel Blob storage plugin. */
export const STORAGE_ADAPTER_WIRED = true

export function isPayloadStorageWired(): boolean {
  return STORAGE_ADAPTER_WIRED && Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}
