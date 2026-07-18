import 'server-only'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type CaptchaState = {
  provider: 'turnstile'
  enabled: boolean
  siteKey?: string
  reason?: 'missing_keys' | 'unsupported_provider'
}

export type TurnstileVerification = {
  success: boolean
  skipped: boolean
  errorCodes: string[]
  challengeTimestamp?: string
  hostname?: string
}

type TurnstileResponse = {
  success?: boolean
  'error-codes'?: unknown
  challenge_ts?: unknown
  hostname?: unknown
}

export function getCaptchaState(): CaptchaState {
  const provider = process.env.CAPTCHA_PROVIDER?.trim().toLowerCase()
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()

  if (provider && provider !== 'turnstile') {
    return { provider: 'turnstile', enabled: false, reason: 'unsupported_provider' }
  }
  if (!siteKey || !secretKey) {
    return { provider: 'turnstile', enabled: false, reason: 'missing_keys' }
  }
  return { provider: 'turnstile', enabled: true, siteKey }
}

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<TurnstileVerification> {
  const state = getCaptchaState()
  if (!state.enabled) {
    return { success: true, skipped: true, errorCodes: [] }
  }

  const cleanToken = token?.trim()
  if (!cleanToken) {
    return { success: false, skipped: false, errorCodes: ['missing-input-response'] }
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!.trim(),
    response: cleanToken,
  })
  if (remoteIp?.trim()) body.set('remoteip', remoteIp.trim())

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
    if (!response.ok) {
      return { success: false, skipped: false, errorCodes: [`http-${response.status}`] }
    }
    const result = await response.json() as TurnstileResponse
    return {
      success: result.success === true,
      skipped: false,
      errorCodes: Array.isArray(result['error-codes'])
        ? result['error-codes'].map(String)
        : [],
      challengeTimestamp: typeof result.challenge_ts === 'string' ? result.challenge_ts : undefined,
      hostname: typeof result.hostname === 'string' ? result.hostname : undefined,
    }
  } catch {
    return { success: false, skipped: false, errorCodes: ['verification-unavailable'] }
  }
}
