import 'server-only'

/**
 * Credentials only express deployment intent. Flip this constant only in the
 * same change that imports and configures a durable Payload storage plugin.
 */
export const STORAGE_ADAPTER_WIRED = false

export function isPayloadStorageWired(): boolean {
  return STORAGE_ADAPTER_WIRED
}
