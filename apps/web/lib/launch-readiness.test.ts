import { afterEach, describe, expect, it } from 'vitest'
import { getLaunchChecks } from './launch-readiness'

describe('launch readiness topology gates', () => {
  afterEach(() => {
    delete process.env.CF_PAGES_STATIC
    delete process.env.NEXT_PUBLIC_STATIC_EXPORT
    delete process.env.ALLOW_STARTER_SEED
    delete process.env.NEXT_PUBLIC_LAUNCH_STATUS
    delete process.env.CAPTCHA_PROVIDER
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    delete process.env.TURNSTILE_SECRET_KEY
  })

  it('fails origin-topology when static export flags are set', () => {
    process.env.CF_PAGES_STATIC = '1'
    const check = getLaunchChecks().find((item) => item.key === 'origin-topology')
    expect(check?.status).toBe('fail')
  })

  it('warns or fails starter-seed when ALLOW_STARTER_SEED is on', () => {
    process.env.ALLOW_STARTER_SEED = 'true'
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'preview'
    const check = getLaunchChecks().find((item) => item.key === 'starter-seed')
    expect(check?.status === 'warn' || check?.status === 'fail').toBe(true)
  })

  it('passes origin-topology on a Node-capable host', () => {
    const check = getLaunchChecks().find((item) => item.key === 'origin-topology')
    expect(check?.status).toBe('pass')
  })

  it('warns on abuse-captcha until Turnstile is configured', () => {
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'preview'
    delete process.env.CAPTCHA_PROVIDER
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    delete process.env.TURNSTILE_SECRET_KEY
    const check = getLaunchChecks().find((item) => item.key === 'abuse-captcha')
    expect(check?.status).toBe('warn')
  })

  it('passes abuse-captcha when Turnstile keys are set', () => {
    process.env.CAPTCHA_PROVIDER = 'turnstile'
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'site-key-example'
    process.env.TURNSTILE_SECRET_KEY = 'secret-key-example'
    const check = getLaunchChecks().find((item) => item.key === 'abuse-captcha')
    expect(check?.status).toBe('pass')
  })
})
