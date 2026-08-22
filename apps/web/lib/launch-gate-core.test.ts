import { afterEach, describe, expect, it } from 'vitest'
import {
  evaluateLaunchEnvChecks,
  launchGateExitCode,
  liveBlockerMessages,
} from './launch-gate-core'

const fixtureLiveEnv: Record<string, string> = {
  NEXT_PUBLIC_LAUNCH_STATUS: 'live',
  NEXT_PUBLIC_SITE_URL: 'https://www.nagarikwatch.com',
  BETTER_AUTH_URL: 'https://www.nagarikwatch.com',
  DATABASE_URL: 'postgres://nagarik:nagarik@localhost:5432/nagarik',
  AUTH_SECRET: 'fixture-auth-secret-32-characters!',
  CONTENT_SOURCE: 'payload',
  PAYLOAD_PUBLIC_SERVER_URL: 'https://admin.nagarikwatch.com',
  PAYLOAD_API_TOKEN: 'fixture-payload-service-account-token',
  PAYLOAD_SECRET: 'fixture-payload-secret-32-characters!',
  REVALIDATE_SECRET: 'fixture-revalidate-secret-32-chars!',
  PAYLOAD_DB_PUSH: 'false',
  NEXT_PUBLIC_PUBLICATION_LEGAL_NAME: 'CI Fixture Publisher Pvt Ltd',
  NEXT_PUBLIC_EDITOR_IN_CHIEF: 'CI Fixture Editor',
  NEXT_PUBLIC_DOIB_NUMBER: 'NW-CI-FIXTURE-REG-99',
  NEXT_PUBLIC_NEWSROOM_PHONE: '+977-01-4000000',
  NEXT_PUBLIC_NEWSROOM_ADDRESS: 'Kathmandu fixture address',
  NEXT_PUBLIC_NEWSROOM_EMAIL: 'desk@example.com',
  RESEND_API_KEY: 're_fixture_key',
  AUTH_EMAIL_FROM: 'Nagarik Watch <accounts@example.com>',
  NEWSLETTER_FROM: 'Nagarik Watch <newsletter@example.com>',
  BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_fixture_token',
  SENTRY_DSN: 'https://public@o0.ingest.sentry.io/0',
  CRON_SECRET: 'fixture-cron-secret-32-characters!!',
  STAFF_MFA_ENABLED: 'true',
  CAPTCHA_PROVIDER: 'turnstile',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-key-example',
  TURNSTILE_SECRET_KEY: 'secret-key-example',
  SUBMISSION_IP_SALT: 'fixture-submission-salt-32-chars!!',
  PARTNER_FEED_TOKENS: 'nw_partner_ci_fixture_token_ok',
  NEXT_PUBLIC_ADS_MODE: 'off',
  PUBLISHED_ARTICLE_COUNT: '30',
}

describe('launch gate core parity', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LAUNCH_STATUS
    delete process.env.CF_PAGES_STATIC
  })

  it('fails live when required secrets are missing', () => {
    const checks = evaluateLaunchEnvChecks({ NEXT_PUBLIC_LAUNCH_STATUS: 'live' })
    expect(launchGateExitCode(checks, true)).toBe(1)
    expect(liveBlockerMessages(checks).length).toBeGreaterThan(0)
  })

  it('passes live with a complete non-placeholder fixture env', () => {
    const checks = evaluateLaunchEnvChecks(fixtureLiveEnv)
    const fails = checks.filter((check) => check.status === 'fail')
    expect(fails.map((check) => check.key)).toEqual([])
    expect(launchGateExitCode(checks, true)).toBe(0)
  })

  it('rejects localhost production origins before launch', () => {
    const checks = evaluateLaunchEnvChecks({
      ...fixtureLiveEnv,
      BETTER_AUTH_URL: 'http://localhost:3000',
    })
    expect(checks.find((check) => check.key === 'auth-url')?.status).toBe('fail')
  })

  it('enforces origin-topology even in preview', () => {
    const checks = evaluateLaunchEnvChecks({ CF_PAGES_STATIC: '1' })
    expect(checks.find((check) => check.key === 'origin-topology')?.status).toBe('fail')
    expect(launchGateExitCode(checks, false)).toBe(1)
  })

  it('surfaces partner tokens, submission salt, and boot passwords', () => {
    const keys = evaluateLaunchEnvChecks(fixtureLiveEnv).map((check) => check.key)
    expect(keys).toEqual(
      expect.arrayContaining([
        'partner-feed-tokens',
        'submission-ip-salt',
        'boot-passwords',
        'auth-auto-migrate',
        'ad-sales-email',
        'cms-health',
      ]),
    )
  })
})
