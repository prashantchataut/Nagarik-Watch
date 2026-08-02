import { describe, expect, it } from 'vitest'
import {
  assertWorkflowTransition,
  canActorTransition,
  reporterMayEditDraft,
} from './workflow-transitions'

describe('workflow transitions', () => {
  it('allows reporter draft → submitted', () => {
    expect(canActorTransition('reporter', 'draft', 'submitted')).toBe(true)
  })

  it('blocks reporter publish', () => {
    expect(canActorTransition('reporter', 'draft', 'published')).toBe(false)
  })

  it('allows editor to return submitted → draft', () => {
    expect(canActorTransition('editor', 'submitted', 'draft')).toBe(true)
  })

  it('allows publisher draft → published (desk one-click publish)', () => {
    expect(canActorTransition('publisher', 'draft', 'published')).toBe(true)
  })

  it('blocks editor draft → published', () => {
    expect(canActorTransition('editor', 'draft', 'published')).toBe(false)
  })

  it('allows publisher submitted → published', () => {
    expect(canActorTransition('publisher', 'submitted', 'published')).toBe(true)
  })

  it('allows publisher ready → published', () => {
    expect(canActorTransition('publisher', 'ready', 'published')).toBe(true)
  })

  it('throws on invalid reporter transition', () => {
    expect(() =>
      assertWorkflowTransition({ role: 'journalist', from: 'submitted', to: 'published' }),
    ).toThrow(/Invalid workflow transition/)
  })

  it('reporter cannot edit submitted drafts', () => {
    expect(reporterMayEditDraft('submitted')).toBe(false)
    expect(reporterMayEditDraft('draft')).toBe(true)
  })
})
