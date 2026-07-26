/**
 * Client-safe auth feature flags. Do not import server-only auth modules into
 * static-exportable pages — use this instead.
 */
export function isGoogleAuthPublicEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
}
