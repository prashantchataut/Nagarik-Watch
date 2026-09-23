import { describe, expect, it } from 'vitest'
import { classifyEditorialAuditEvents } from './editorial-audit'

describe('editorial audit event classification', () => {
  it('records article creation without copying article content', () => {
    expect(
      classifyEditorialAuditEvents({}, { workflowStage: 'idea', _status: 'draft' }, 'create'),
    ).toEqual([
      {
        eventType: 'article_created',
        toValue: 'idea',
        metadata: { status: 'draft' },
      },
    ])
  })

  it('records workflow and publication transitions independently', () => {
    const events = classifyEditorialAuditEvents(
      { workflowStage: 'ready', _status: 'draft' },
      { workflowStage: 'published', _status: 'published' },
      'update',
    )

    expect(events.map((event) => event.eventType)).toEqual([
      'workflow_transition',
      'publication_status_changed',
    ])
  })

  it('records correction counts and AI approval without retaining sensitive article text', () => {
    const events = classifyEditorialAuditEvents(
      { corrections: [], aiSummary: 'Draft', aiSummaryApproved: false },
      {
        corrections: [{ summary: 'Corrected date' }],
        aiSummary: 'Draft',
        aiSummaryApproved: true,
      },
      'update',
    )

    expect(events).toEqual([
      {
        eventType: 'correction_changed',
        metadata: { previousCount: 0, nextCount: 1 },
      },
      {
        eventType: 'ai_assistance_changed',
        metadata: {
          hadSuggestion: true,
          hasSuggestion: true,
          wasApproved: false,
          isApproved: true,
        },
      },
    ])
  })

  it('ignores ordinary content edits already retained by Payload versions', () => {
    expect(
      classifyEditorialAuditEvents(
        { titleNe: 'Old', workflowStage: 'draft', _status: 'draft' },
        { titleNe: 'New', workflowStage: 'draft', _status: 'draft' },
        'update',
      ),
    ).toEqual([])
  })
})
