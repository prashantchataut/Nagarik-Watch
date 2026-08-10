/**
 * Pure helpers for the syndication partner feed (`app/feeds/partner.json`):
 * license tagging, headline/summary truncation for partner display limits,
 * partner-token shape validation, and embargo-window gating. No partner
 * revenue or delivery data is fabricated here.
 */

export const PARTNER_LICENSE_TAGS = [
  'all-rights',
  'partner-limited',
  'wire',
  'cc-attribution',
] as const
export type PartnerLicenseTag = (typeof PARTNER_LICENSE_TAGS)[number]

export function isKnownLicenseTag(value: string): value is PartnerLicenseTag {
  return (PARTNER_LICENSE_TAGS as readonly string[]).includes(value)
}

/** Default license for syndicated items until a story is explicitly tagged otherwise. */
export function licenseTagFor(input: {
  isWireCopy?: boolean
  partnerLimited?: boolean
}): PartnerLicenseTag {
  if (input.isWireCopy) return 'wire'
  if (input.partnerLimited) return 'partner-limited'
  return 'all-rights'
}

/** Truncate feed text at a word boundary so partner displays never cut mid-word. */
export function truncateForFeed(text: string, maxLength: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  const slice = trimmed.slice(0, Math.max(0, maxLength - 1))
  const lastSpace = slice.lastIndexOf(' ')
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.trimEnd()}…`
}

export type PartnerTokenCheck = {
  ok: boolean
  reason?: string
}

const PARTNER_TOKEN_PREFIX = 'nw_partner_'
const PARTNER_TOKEN_MIN_LENGTH = 24

/**
 * Shape-only validation for a partner feed token — confirms the token looks
 * like one Nagarik Watch would issue. This never calls a vendor API; actual
 * authorization still happens against configured partner secrets server-side.
 */
export function checkPartnerTokenShape(token: string | null | undefined): PartnerTokenCheck {
  if (!token) return { ok: false, reason: 'missing token' }
  if (!token.startsWith(PARTNER_TOKEN_PREFIX))
    return { ok: false, reason: 'unexpected token prefix' }
  if (token.length < PARTNER_TOKEN_MIN_LENGTH) return { ok: false, reason: 'token too short' }
  return { ok: true }
}

export type EmbargoWindow = {
  /** ISO timestamp; the item may not be exposed to partners before this instant. */
  embargoUntil?: string | null
}

/** True once (or if there was never) an embargo blocking partner exposure. */
export function isPastEmbargo(item: EmbargoWindow, now: Date = new Date()): boolean {
  if (!item.embargoUntil) return true
  const releaseAt = Date.parse(item.embargoUntil)
  if (!Number.isFinite(releaseAt)) return true
  return now.getTime() >= releaseAt
}

export function embargoRemainingMs(item: EmbargoWindow, now: Date = new Date()): number {
  if (!item.embargoUntil) return 0
  const releaseAt = Date.parse(item.embargoUntil)
  if (!Number.isFinite(releaseAt)) return 0
  return Math.max(0, releaseAt - now.getTime())
}
