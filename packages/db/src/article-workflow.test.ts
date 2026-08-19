import { describe, expect, it } from 'vitest'
import {
  assertEnglishPublicationReady,
  assertPublishableHero,
  canActorTransition,
  isAllowedWorkflowTransition,
  isPublicWorkflowStage,
  reporterMayEditDraft,
  reviewTimestampFieldForStage,
} from './article-workflow'

describe('article workflow policy', () => {
  it('allows reporter draft → submitted', () => {
    expect(canActorTransition('reporter', 'draft', 'submitted')).toBe(true)
  })

  it('blocks reporter publish', () => {
    expect(canActorTransition('reporter', 'draft', 'published')).toBe(false)
  })

  it('blocks graph-illegal jumps', () => {
    expect(isAllowedWorkflowTransition('idea', 'published')).toBe(false)
    expect(isAllowedWorkflowTransition('fact_check', 'published')).toBe(false)
  })

  it('allows system scheduled → published', () => {
    expect(canActorTransition('system', 'scheduled', 'published')).toBe(true)
  })

  it('treats only published/updated as public reader stages', () => {
    expect(isPublicWorkflowStage('published')).toBe(true)
    expect(isPublicWorkflowStage('scheduled')).toBe(false)
  })

  it('blocks journalist edits past draft stages', () => {
    expect(reporterMayEditDraft('draft')).toBe(true)
    expect(reporterMayEditDraft('submitted')).toBe(false)
    expect(reporterMayEditDraft('fact_check')).toBe(false)
  })

  it('maps review timestamp fields', () => {
    expect(reviewTimestampFieldForStage('submitted')).toBe('submittedAt')
    expect(reviewTimestampFieldForStage('fact_check')).toBe('factCheckedAt')
    expect(reviewTimestampFieldForStage('published')).toBeNull()
  })

  it('requires English fields when englishStatus is published', () => {
    expect(() =>
      assertEnglishPublicationReady({
        englishStatus: 'published',
        titleEn: 'Budget',
        bodyEn: [],
      }),
    ).toThrow(/titleEn and bodyEn/)
  })

  it('requires hero image for published reader stages', () => {
    expect(() =>
      assertPublishableHero({
        status: 'published',
        workflowStage: 'published',
        heroImage: null,
      }),
    ).toThrow(/hero image/)
  })
})
