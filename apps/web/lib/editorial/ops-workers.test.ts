import { describe, expect, it } from 'vitest'
import { canActorTransition } from '@/lib/editorial/workflow-transitions'
import { getPayloadCutoverChecklist } from '@/lib/content/payload-cutover'
import { houseAdExperimentId } from '@/lib/house-ads'

describe('scheduled publish transitions', () => {
  it('allows system scheduled → published only', () => {
    expect(canActorTransition('system', 'scheduled', 'published')).toBe(true)
    expect(canActorTransition('system', 'draft', 'published')).toBe(false)
    expect(canActorTransition('system', 'ready', 'published')).toBe(false)
  })
})

describe('payload cutover checklist', () => {
  it('returns structured checks without inventing readiness', () => {
    const cutover = getPayloadCutoverChecklist()
    expect(cutover.checks.length).toBeGreaterThanOrEqual(7)
    expect(cutover.checks.every((check) => check.key && check.label && check.detail)).toBe(true)
  })
})

describe('house ad experiment ids', () => {
  it('namespaces placement keys', () => {
    expect(houseAdExperimentId('home-top')).toBe('house-ad-home-top')
  })
})
