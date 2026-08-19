import { createHash, timingSafeEqual } from 'node:crypto'
import { parsePartnerFeedTokens } from './partner-feed'

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

export function authorizePartnerFeedToken(
  presented: string | null | undefined,
  configuredTokens: readonly string[],
): boolean {
  if (!presented || configuredTokens.length === 0) return false
  const presentedDigest = digest(presented)
  let matched = false
  for (const token of configuredTokens) {
    const candidate = digest(token)
    if (
      candidate.length === presentedDigest.length &&
      timingSafeEqual(candidate, presentedDigest)
    ) {
      matched = true
    }
  }
  return matched
}

export function configuredPartnerFeedTokens(
  raw: string | undefined | null = process.env.PARTNER_FEED_TOKENS,
): string[] {
  return parsePartnerFeedTokens(raw)
}
