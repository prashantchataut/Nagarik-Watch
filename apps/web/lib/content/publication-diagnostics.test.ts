import { describe, expect, it } from 'vitest'
import { diagnosePublication } from './publication-diagnostics'

describe('publication diagnostics', () => {
  it('explains a published article that is missing publishAt', () => {
    expect(diagnosePublication({ status: 'published', workflowStage: 'published' })).toEqual({
      visible: false,
      reasons: ['publish time is missing'],
    })
  })

  it('fails closed on a malformed publication time', () => {
    const result = diagnosePublication({
      status: 'published',
      workflowStage: 'published',
      publishAt: 'not-a-date',
    })
    expect(result.visible).toBe(false)
    expect(result.reasons).toContain('publish time is invalid')
  })

  it('explains scheduled content', () => {
    const result = diagnosePublication({
      status: 'published',
      workflowStage: 'published',
      publishAt: '2099-01-01T00:00:00.000Z',
      now: new Date('2026-01-01T00:00:00.000Z'),
    })
    expect(result.visible).toBe(false)
    expect(result.reasons).toContain('publish time has not arrived')
  })
})
