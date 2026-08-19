import { describe, expect, it } from 'vitest'
import {
  canActorTransition,
  isValidHttpUrl,
  reporterMayEditDraft,
} from '@nagarikwatch/db'

/**
 * Contract for the journalist→Payload bridge lock.
 * The PATCH client refuses post-submitted CMS stages even when local meta is stale.
 */
describe('journalist Payload bridge contract', () => {
  it('refuses reporter edits once the live CMS stage leaves draft', () => {
    expect(reporterMayEditDraft('draft')).toBe(true)
    expect(reporterMayEditDraft('submitted')).toBe(false)
    expect(reporterMayEditDraft('fact_check')).toBe(false)
    expect(reporterMayEditDraft('ready')).toBe(false)
    expect(reporterMayEditDraft('published')).toBe(false)
  })

  it('allows only reporter-legal stage writes from the desk', () => {
    expect(canActorTransition('reporter', 'draft', 'submitted')).toBe(true)
    expect(canActorTransition('reporter', 'draft', 'fact_check')).toBe(false)
    expect(canActorTransition('reporter', 'fact_check', 'draft')).toBe(false)
  })

  it('requires http(s) media handoff URLs', () => {
    expect(isValidHttpUrl('https://cdn.example.com/hero.jpg')).toBe(true)
    expect(isValidHttpUrl('ftp://cdn.example.com/hero.jpg')).toBe(false)
    expect(isValidHttpUrl('not-a-url')).toBe(false)
  })
})
