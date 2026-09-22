import { describe, expect, it } from 'vitest'
import { trollRiskScore } from '@nagarikwatch/db'
import { triageComment } from './comment-triage'

describe('triageComment', () => {
  it('leaves an ordinary comment in the pending queue', () => {
    const troll = trollRiskScore({
      approvedComments: 12,
      rejectedComments: 0,
      commentsLastTenMinutes: 1,
      text: 'यो समाचार उपयोगी लाग्यो।',
    })
    expect(triageComment('pending', [], troll)).toEqual({
      status: 'pending',
      flags: [],
      escalated: false,
    })
  })

  it('flags a clean-looking flood from an account with a bad history', () => {
    // Nothing in the text is objectionable — this is exactly the case
    // per-comment moderation cannot catch.
    const troll = trollRiskScore({
      approvedComments: 1,
      rejectedComments: 9,
      commentsLastTenMinutes: 10,
      text: 'ठीकै छ।',
    })
    const result = triageComment('pending', ['banned_word_none'], troll)
    expect(result.status).toBe('flagged')
    expect(result.escalated).toBe(true)
    expect(result.flags).toContain('troll_risk')
    expect(result.flags).toContain('high_reject_rate')
    expect(result.flags).toContain('posting_burst')
  })

  it('never un-rejects a comment the text verdict already rejected', () => {
    const troll = trollRiskScore({
      approvedComments: 0,
      rejectedComments: 10,
      commentsLastTenMinutes: 12,
      text: 'http://spam.example http://spam.example',
    })
    expect(triageComment('rejected', ['banned_word'], troll).status).toBe('rejected')
    expect(triageComment('flagged', [], troll).status).toBe('flagged')
  })

  it('treats an anonymous commenter with no history as ordinary', () => {
    // No history is not evidence of good behaviour, but it is not evidence of
    // bad behaviour either, and guessing here would flag every first comment.
    expect(triageComment('pending', [], null).escalated).toBe(false)
  })
})
