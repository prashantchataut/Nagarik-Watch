import 'server-only'
import { isValidHttpUrl } from '@nagarikwatch/db'

/**
 * Allowlist for URL-only media library registrations on the emergency desk.
 * Prefer https; http allowed only for localhost in non-production.
 */
export function isAllowedMediaLibraryUrl(raw: string): boolean {
  if (!isValidHttpUrl(raw)) return false
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }

  if (url.protocol === 'https:') return true
  if (url.protocol !== 'http:') return false

  const host = url.hostname.toLowerCase()
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1'
  if (!isLocal) return false
  return process.env.NODE_ENV !== 'production'
}
