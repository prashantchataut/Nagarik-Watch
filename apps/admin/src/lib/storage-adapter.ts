/** The official Payload Vercel Blob plugin is configured in payload.config.ts. */
export const STORAGE_ADAPTER_WIRED = true

export function isPayloadStorageWired(): boolean {
  return STORAGE_ADAPTER_WIRED && Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}
