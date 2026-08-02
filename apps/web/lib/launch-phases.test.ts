import { afterEach, describe, expect, it } from 'vitest'
import { getLaunchPhases, getLaunchStatusSummary, resolveLaunchPhases } from './launch-phases'
import { getLaunchChecks } from './launch-readiness'

describe('launch phases', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LAUNCH_STATUS
    delete process.env.CF_PAGES_STATIC
    delete process.env.CONTENT_SOURCE
    delete process.env.CAPTCHA_PROVIDER
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    delete process.env.TURNSTILE_SECRET_KEY
  })

  it('exposes soft then hard checklists for /admin/launch', () => {
    const phases = getLaunchPhases()
    expect(phases.map((phase) => phase.id)).toEqual(['soft', 'hard'])
    expect(phases[0]?.items.length).toBeGreaterThanOrEqual(5)
    expect(phases[1]?.items.some((item) => item.id === 'gate')).toBe(true)
    expect(phases[0]?.items.every((item) => item.checkKeys.length >= 0)).toBe(true)
  })

  it('resolves phase items from launch checks', () => {
    process.env.CF_PAGES_STATIC = '1'
    const resolved = resolveLaunchPhases(getLaunchChecks())
    const soft = resolved.find((phase) => phase.id === 'soft')
    const dns = soft?.items.find((item) => item.id === 'dns-vercel')
    expect(dns?.status).toBe('fail')
  })

  it('summarizes stage as topology when static export is on', () => {
    process.env.CF_PAGES_STATIC = '1'
    const checks = getLaunchChecks()
    const summary = getLaunchStatusSummary(checks, 40)
    expect(summary.stage).toBe('topology')
    expect(summary.inRepoComplete).toBe(true)
    expect(summary.nextAction.toLowerCase()).toContain('vercel')
  })

  it('wires turnstile into hard phase via abuse-captcha', () => {
    const checks = getLaunchChecks()
    expect(checks.some((check) => check.key === 'abuse-captcha')).toBe(true)
    const hard = resolveLaunchPhases(checks).find((phase) => phase.id === 'hard')
    const turnstile = hard?.items.find((item) => item.id === 'turnstile')
    expect(turnstile?.evidence).toContain('abuse-captcha')
  })
})
