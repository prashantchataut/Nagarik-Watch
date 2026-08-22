import { describe, expect, it } from 'vitest'
import { buildPublicArticleWhere, evaluatePublicationVisibility } from './publication'

describe('reader publication contract', () => {
  it('fails closed when a published row is missing publishAt', () => {
    expect(
      evaluatePublicationVisibility({
        status: 'published',
        workflowStage: 'published',
        publishAt: null,
      }),
    ).toEqual({ visible: false, reasons: ['publish time is missing'] })
  })

  it('exposes a due scheduled row even before the scheduler promotes its workflow label', () => {
    const result = evaluatePublicationVisibility(
      {
        status: 'published',
        workflowStage: 'scheduled',
        publishAt: '2026-08-20T23:55:00.000Z',
      },
      new Date('2026-08-21T00:00:00.000Z'),
    )
    expect(result.visible).toBe(true)
  })

  it('blocks future and malformed publication times', () => {
    const now = new Date('2026-08-21T00:00:00.000Z')
    expect(
      evaluatePublicationVisibility(
        {
          status: 'published',
          workflowStage: 'published',
          publishAt: '2026-08-22T00:00:00.000Z',
        },
        now,
      ).visible,
    ).toBe(false)
    expect(
      evaluatePublicationVisibility(
        { status: 'published', workflowStage: 'published', publishAt: 'not-a-date' },
        now,
      ).reasons,
    ).toContain('publish time is invalid')
  })

  it('keeps noIndex outside the reader visibility contract', () => {
    const result = evaluatePublicationVisibility({
      status: 'published',
      workflowStage: 'updated',
      publishAt: '2026-08-20T00:00:00.000Z',
    })
    expect(result.visible).toBe(true)
  })

  it('nests publication clauses so other top-level or filters cannot replace them', () => {
    const where = buildPublicArticleWhere('2026-08-21T00:00:00.000Z')
    expect(where.and[0]).toEqual({ _status: { equals: 'published' } })
    expect(where.and[1]).toEqual({ workflowStage: { in: ['scheduled', 'published', 'updated'] } })
    expect(where.and[2]).toEqual({
      publishAt: { less_than_equal: '2026-08-21T00:00:00.000Z' },
    })
  })
})
