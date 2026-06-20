/**
 * Ambient module declarations for build-time-only dependencies that apps/web references but
 * does not bundle. The Payload config lives in apps/admin and is resolved at runtime via
 * `@payload-config` when the Payload-backed content source is enabled; in the seed-source
 * path (default, no DB) the import is never reached, so this shim keeps typecheck green.
 */
declare module '@payload-config' {
  const config: unknown
  export default config
}

declare module 'payload' {
  export type SanitizedConfig = unknown
  export type BasePayload = {
    find: (args: {
      collection: string
      where?: Record<string, unknown>
      sort?: string
      limit?: number
      page?: number
      depth?: number
    }) => Promise<{
      docs: unknown[]
      totalDocs?: number
      totalPages?: number
      page?: number
    }>
  }
  export function getPayload(args: { config: unknown }): Promise<BasePayload>
}
