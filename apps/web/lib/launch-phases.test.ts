import { describe, expect, it } from 'vitest'
import { getLaunchPhases } from './launch-phases'

describe('launch phases', () => {
  it('exposes soft then hard checklists for /admin/launch', () => {
    const phases = getLaunchPhases()
    expect(phases.map((phase) => phase.id)).toEqual(['soft', 'hard'])
    expect(phases[0]?.items.length).toBeGreaterThanOrEqual(5)
    expect(phases[1]?.items.some((item) => item.id === 'gate')).toBe(true)
  })
})
