/**
 * Content authority resolution — single gate for which backend the reader uses.
 * Fail closed when env claims Payload but the CMS URL is missing (never silent
 * fallthrough to the desk store).
 */
import 'server-only'
import type { ContentSource } from './source'
import { createStoreContentSource } from './store/store-source'
import {
  declaredContentSource,
  isPayloadCanonical,
  isPayloadSourceMisconfigured,
} from './payload-admin-client'

export function contentSourceFingerprint(): string {
  const source = declaredContentSource()
  const url =
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim() || ''
  return `${source}|${url}`
}

export async function resolveContentSource(): Promise<ContentSource> {
  if (isPayloadSourceMisconfigured()) {
    const source = declaredContentSource()
    const launchLive =
      (process.env.NEXT_PUBLIC_LAUNCH_STATUS?.trim() || 'preview').toLowerCase() === 'live'
    throw new Error(
      launchLive && source !== 'payload'
        ? 'NEXT_PUBLIC_LAUNCH_STATUS=live requires CONTENT_SOURCE=payload. Refusing to serve from the shadow desk store.'
        : 'CONTENT_SOURCE=payload requires PAYLOAD_PUBLIC_SERVER_URL (or PAYLOAD_ADMIN_URL). Refusing to fall back to the desk store.',
    )
  }

  if (isPayloadCanonical()) {
    const { createPayloadContentSource } = await import('./payload-source')
    return createPayloadContentSource()
  }

  return createStoreContentSource()
}
