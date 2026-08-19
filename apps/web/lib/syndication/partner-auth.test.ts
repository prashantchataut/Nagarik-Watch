import { describe, expect, it } from 'vitest'
import { authorizePartnerFeedToken, configuredPartnerFeedTokens } from './partner-auth'

describe('authorizePartnerFeedToken', () => {
  const tokens = ['nw_partner_aaaaaaaaaaaaaaaa', 'nw_partner_bbbbbbbbbbbbbbbb']

  it('fails closed when no tokens are configured', () => {
    expect(authorizePartnerFeedToken('nw_partner_aaaaaaaaaaaaaaaa', [])).toBe(false)
  })

  it('fails closed when the presented token is missing', () => {
    expect(authorizePartnerFeedToken(null, tokens)).toBe(false)
  })

  it('accepts a configured token', () => {
    expect(authorizePartnerFeedToken('nw_partner_aaaaaaaaaaaaaaaa', tokens)).toBe(true)
  })

  it('rejects a well-shaped but unknown token', () => {
    expect(authorizePartnerFeedToken('nw_partner_cccccccccccccccc', tokens)).toBe(false)
  })

  it('parses PARTNER_FEED_TOKENS from the environment string', () => {
    expect(configuredPartnerFeedTokens('nw_partner_aaaaaaaaaaaaaaaa')).toEqual([
      'nw_partner_aaaaaaaaaaaaaaaa',
    ])
  })
})
