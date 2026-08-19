import { describe, expect, it } from 'vitest'
import {
  checkPartnerTokenShape,
  embargoRemainingMs,
  isKnownLicenseTag,
  isPastEmbargo,
  licenseTagFor,
  parsePartnerFeedTokens,
  presentedPartnerToken,
  truncateForFeed,
} from './partner-feed'

describe('licenseTagFor / isKnownLicenseTag', () => {
  it('tags wire copy and partner-limited stories distinctly', () => {
    expect(licenseTagFor({ isWireCopy: true })).toBe('wire')
    expect(licenseTagFor({ partnerLimited: true })).toBe('partner-limited')
    expect(licenseTagFor({})).toBe('all-rights')
  })

  it('validates known license tags only', () => {
    expect(isKnownLicenseTag('wire')).toBe(true)
    expect(isKnownLicenseTag('exclusive')).toBe(false)
  })
})

describe('truncateForFeed', () => {
  it('keeps short text untouched', () => {
    expect(truncateForFeed('Short headline', 80)).toBe('Short headline')
  })

  it('truncates at a word boundary with an ellipsis', () => {
    const long =
      'Flood warning issued for the Koshi river basin after heavy monsoon rainfall overnight'
    const truncated = truncateForFeed(long, 40)
    expect(truncated.length).toBeLessThanOrEqual(41)
    expect(truncated.endsWith('…')).toBe(true)
    expect(truncated).not.toMatch(/\s…$/)
  })
})

describe('checkPartnerTokenShape', () => {
  it('rejects a missing token', () => {
    expect(checkPartnerTokenShape(null).ok).toBe(false)
  })

  it('rejects a wrong-prefix token', () => {
    expect(checkPartnerTokenShape('token_abcdefghijklmnopqrstuvwxyz').ok).toBe(false)
  })

  it('rejects a too-short token', () => {
    expect(checkPartnerTokenShape('nw_partner_1').ok).toBe(false)
  })

  it('accepts a well-shaped token', () => {
    expect(checkPartnerTokenShape('nw_partner_abcdefghijklmnop').ok).toBe(true)
  })
})

describe('parsePartnerFeedTokens / presentedPartnerToken', () => {
  it('splits comma or whitespace configured tokens', () => {
    expect(parsePartnerFeedTokens('nw_partner_aaaaaaaaaaaaaaaa, nw_partner_bbbbbbbbbbbbbbbb')).toEqual(
      ['nw_partner_aaaaaaaaaaaaaaaa', 'nw_partner_bbbbbbbbbbbbbbbb'],
    )
  })

  it('prefers the Authorization bearer over a query token', () => {
    expect(presentedPartnerToken('Bearer nw_partner_from_header_ok', 'nw_partner_from_query')).toBe(
      'nw_partner_from_header_ok',
    )
  })
})

describe('isPastEmbargo / embargoRemainingMs', () => {
  it('treats no embargo as already released', () => {
    expect(isPastEmbargo({})).toBe(true)
    expect(embargoRemainingMs({})).toBe(0)
  })

  it('blocks exposure before the embargo instant', () => {
    const now = new Date('2026-07-18T00:00:00Z')
    const future = { embargoUntil: '2026-07-18T06:00:00Z' }
    expect(isPastEmbargo(future, now)).toBe(false)
    expect(embargoRemainingMs(future, now)).toBe(6 * 60 * 60 * 1000)
  })

  it('releases once the embargo instant has passed', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const past = { embargoUntil: '2026-07-18T06:00:00Z' }
    expect(isPastEmbargo(past, now)).toBe(true)
    expect(embargoRemainingMs(past, now)).toBe(0)
  })
})
