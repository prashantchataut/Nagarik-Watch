import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getCaptchaState, verifyTurnstileToken } from './turnstile'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Turnstile configuration', () => {
  it('is safely disabled when keys are empty', async () => {
    vi.stubEnv('CAPTCHA_PROVIDER', 'turnstile')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')

    expect(getCaptchaState()).toEqual({
      provider: 'turnstile',
      enabled: false,
      reason: 'missing_keys',
    })
    await expect(verifyTurnstileToken(undefined)).resolves.toEqual({
      success: true,
      skipped: true,
      errorCodes: [],
    })
  })

  it('rejects an empty token when configured without making a request', async () => {
    vi.stubEnv('CAPTCHA_PROVIDER', 'turnstile')
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'site-key')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-key')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(verifyTurnstileToken('')).resolves.toEqual({
      success: false,
      skipped: false,
      errorCodes: ['missing-input-response'],
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
