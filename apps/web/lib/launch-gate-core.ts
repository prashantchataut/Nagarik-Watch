/**
 * Shared launch-gate rules used by `pnpm launch:gate` and `/admin/launch`.
 * Env-only: no database I/O. Live probes overlay the same keys in getLaunchChecksAsync.
 */

export type LaunchCheckStatus = 'pass' | 'warn' | 'fail'

export type LaunchCheck = {
  key: string
  label: string
  status: LaunchCheckStatus
  detail: string
}

export type LaunchGateEnv = Record<string, string | undefined>

const PREVIEW_ENFORCED_FAIL_KEYS = new Set(['origin-topology'])

export const OPERATOR_OWNED_CHECK_KEYS = new Set([
  'site-url',
  'auth-url',
  'database',
  'auth-secret',
  'content-source',
  'payload-url',
  'payload-token',
  'payload-secret',
  'revalidation-secret',
  'ops-migrations',
  'legal-name',
  'editor-in-chief',
  'registration',
  'newsroom-contact',
  'newsroom-email',
  'newsroom-phone',
  'content-volume',
  'email',
  'storage',
  'analytics',
  'error-monitoring',
  'network-ads',
  'house-ads-soft',
  'tts-provider',
  'semantic-search',
  'background-push',
  'notification-cron',
  'payments',
  'staff-mfa',
  'abuse-captcha',
  'live-data',
  'auth-auto-migrate',
  'submission-ip-salt',
  'partner-feed-tokens',
  'boot-passwords',
  'ad-sales-email',
  'cms-health',
  'auth-email-from',
  'newsletter-from',
])

export function envValue(env: LaunchGateEnv, name: string): string {
  return env[name]?.trim() ?? ''
}

export function looksUnverified(input: string): boolean {
  const lower = input.toLowerCase()
  return (
    !input ||
    lower.includes('placeholder') ||
    lower.includes('pending') ||
    lower.includes('replace-before-launch') ||
    lower.includes('change-me') ||
    lower.includes('0000000')
  )
}

function isLive(env: LaunchGateEnv): boolean {
  return (envValue(env, 'NEXT_PUBLIC_LAUNCH_STATUS') || 'preview').toLowerCase() === 'live'
}

function postgresConfigured(env: LaunchGateEnv): boolean {
  const candidates = [
    envValue(env, 'DATABASE_URL'),
    envValue(env, 'POSTGRES_URL'),
    envValue(env, 'POSTGRES_PRISMA_URL'),
    envValue(env, 'POSTGRES_URL_NON_POOLING'),
    envValue(env, 'NEON_DATABASE_URL'),
  ]
  return candidates.some((value) => /^postgres(?:ql)?:\/\//i.test(value))
}

function isProductionHttpsOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    return (
      url.protocol === 'https:' &&
      host !== 'localhost' &&
      host !== '127.0.0.1' &&
      host !== '::1' &&
      !host.endsWith('.localhost')
    )
  } catch {
    return false
  }
}

function verifiedSetting(
  key: string,
  label: string,
  env: LaunchGateEnv,
  envName: string,
  options: {
    required?: boolean
    secret?: boolean
    warning?: string
    productionUrl?: boolean
  } = {},
): LaunchCheck {
  const current = envValue(env, envName)
  const invalidValue = looksUnverified(current) || (options.secret === true && current.length < 32)
  const invalidProductionUrl = options.productionUrl === true && !isProductionHttpsOrigin(current)
  const invalid = invalidValue || invalidProductionUrl
  const required = options.required !== false
  return {
    key,
    label,
    status: invalid ? (required ? 'fail' : 'warn') : 'pass',
    detail: invalid
      ? invalidProductionUrl && !invalidValue
        ? `${envName} must be a public HTTPS origin, not localhost or plain HTTP`
        : (options.warning ?? `${envName} is missing or still a placeholder`)
      : `${envName} is configured`,
  }
}

function adsMode(env: LaunchGateEnv): 'off' | 'house' | 'network' {
  const value = envValue(env, 'NEXT_PUBLIC_ADS_MODE')
  if (value === 'off' || value === 'house' || value === 'network') return value
  return 'off'
}

function emailReady(env: LaunchGateEnv): boolean {
  return Boolean(
    envValue(env, 'RESEND_API_KEY') ||
      (envValue(env, 'NEWSLETTER_API_KEY') && envValue(env, 'NEWSLETTER_API_BASE')),
  )
}

function captchaEnabled(env: LaunchGateEnv): { enabled: boolean; unsupported: boolean } {
  const provider = envValue(env, 'CAPTCHA_PROVIDER').toLowerCase()
  if (provider && provider !== 'turnstile') return { enabled: false, unsupported: true }
  const site = envValue(env, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY')
  const secret = envValue(env, 'TURNSTILE_SECRET_KEY')
  return { enabled: Boolean(site && secret), unsupported: false }
}

export function evaluateLaunchEnvChecks(env: LaunchGateEnv = process.env): LaunchCheck[] {
  const live = isLive(env)
  const dbOk = postgresConfigured(env)
  const contentSource =
    envValue(env, 'CONTENT_SOURCE') || envValue(env, 'PAYLOAD_CONTENT_SOURCE') || 'payload'
  const staticExport =
    envValue(env, 'NEXT_PUBLIC_STATIC_EXPORT') === '1' ||
    envValue(env, 'CF_PAGES_STATIC') === '1' ||
    envValue(env, 'NEXT_PUBLIC_STATIC_EXPORT').toLowerCase() === 'true'
  const starterSeed = envValue(env, 'ALLOW_STARTER_SEED').toLowerCase()
  const ads = adsMode(env)
  const captcha = captchaEnabled(env)
  const blobReady = Boolean(envValue(env, 'BLOB_READ_WRITE_TOKEN'))
  const objectStoragePublicBase = Boolean(
    envValue(env, 'STORAGE_PUBLIC_BASE_URL') || envValue(env, 'R2_PUBLIC_BASE_URL'),
  )
  const storageCredentialsPresent = Object.entries(env).some(
    ([name, current]) =>
      /^(STORAGE_|S3_|BLOB_)/.test(name) && typeof current === 'string' && Boolean(current.trim()),
  )
  const webMediaUploadReady = blobReady || (storageCredentialsPresent && objectStoragePublicBase)
  const pushConfigured = Boolean(
    envValue(env, 'NEXT_PUBLIC_WEB_PUSH_VAPID_KEY') &&
      envValue(env, 'WEB_PUSH_VAPID_PRIVATE_KEY') &&
      envValue(env, 'WEB_PUSH_SUBJECT'),
  )
  const payloadRequired = live || contentSource === 'payload'
  const sentryDsn = envValue(env, 'SENTRY_DSN') || envValue(env, 'NEXT_PUBLIC_SENTRY_DSN')
  const publishedCount = Number(envValue(env, 'PUBLISHED_ARTICLE_COUNT') || 0)
  const launchMinimum = Number(envValue(env, 'LAUNCH_MIN_PUBLISHED_ARTICLES') || 30)
  const networkAdsReady = Boolean(
    envValue(env, 'NEXT_PUBLIC_ADSENSE_CLIENT') || envValue(env, 'NEXT_PUBLIC_GAM_NETWORK_CODE'),
  )

  return [
    {
      key: 'origin-topology',
      label: 'Launch origin (Node, not static Pages)',
      status: staticExport ? 'fail' : 'pass',
      detail: staticExport
        ? 'Static export build detected — APIs are stripped. Point apex at Vercel Node (ADR-004 / docs/launch-runbook.md)'
        : 'Host is not a static-export Pages build',
    },
    verifiedSetting('site-url', 'Public site URL', env, 'NEXT_PUBLIC_SITE_URL', {
      required: live,
      productionUrl: live,
    }),
    verifiedSetting('auth-url', 'Better Auth URL', env, 'BETTER_AUTH_URL', {
      required: live,
      productionUrl: live,
    }),
    {
      key: 'database',
      label: 'Persistent database',
      status: dbOk ? 'pass' : live ? 'fail' : 'warn',
      detail: dbOk
        ? 'DATABASE_URL points to Postgres'
        : 'Memory/PGlite mode is not production-safe',
    },
    verifiedSetting(
      'auth-secret',
      'Authentication secret',
      env,
      envValue(env, 'AUTH_SECRET') ? 'AUTH_SECRET' : 'BETTER_AUTH_SECRET',
      { secret: true, required: live },
    ),
    {
      key: 'content-source',
      label: 'Canonical content source',
      status:
        live && contentSource !== 'payload'
          ? 'fail'
          : contentSource === 'payload'
            ? 'pass'
            : contentSource === 'json'
            ? dbOk
              ? 'pass'
              : 'warn'
            : 'fail',
      detail:
        contentSource === 'payload'
          ? 'Payload CMS is canonical'
          : contentSource === 'json'
            ? dbOk
              ? 'Explicit emergency/local JSON desk mode on Postgres'
              : 'Explicit local JSON desk mode — not suitable for launch'
            : 'Payload CMS is the default authority; configure PAYLOAD_PUBLIC_SERVER_URL',
    },
    {
      key: 'starter-seed',
      label: 'Starter seed inventory',
      status:
        starterSeed === 'true' || starterSeed === '1'
          ? live || dbOk
            ? 'fail'
            : 'warn'
          : 'pass',
      detail:
        starterSeed === 'true' || starterSeed === '1'
          ? 'Legacy ALLOW_STARTER_SEED is set. Source-code article fixtures have been removed; delete this obsolete flag.'
          : 'No legacy starter-seed flag is present; runtime article fixtures are not shipped.',
    },
    verifiedSetting('payload-url', 'Payload CMS URL', env, 'PAYLOAD_PUBLIC_SERVER_URL', {
      required: payloadRequired,
      productionUrl: live,
    }),
    verifiedSetting('payload-token', 'Payload service account', env, 'PAYLOAD_API_TOKEN', {
      required: payloadRequired,
    }),
    verifiedSetting('payload-secret', 'Payload secret', env, 'PAYLOAD_SECRET', {
      secret: true,
      required: payloadRequired,
    }),
    verifiedSetting('revalidation-secret', 'CMS revalidation secret', env, 'REVALIDATE_SECRET', {
      secret: true,
      required: payloadRequired,
    }),
    {
      key: 'schema-migrations',
      label: 'Database migration mode',
      status: contentSource !== 'payload' || envValue(env, 'PAYLOAD_DB_PUSH') === 'false' ? 'pass' : 'fail',
      detail:
        contentSource !== 'payload'
          ? 'In-app article store does not require Payload migrations'
          : envValue(env, 'PAYLOAD_DB_PUSH') === 'false'
            ? 'Production schema push is disabled; checked-in migrations are authoritative'
            : 'Set PAYLOAD_DB_PUSH=false and run checked-in migrations before launch',
    },
    {
      key: 'ops-migrations',
      label: 'Operational schema migrations',
      status: 'warn',
      detail: 'Ops migration status not probed — run pnpm migrate:ops against Postgres before launch',
    },
    verifiedSetting('legal-name', 'Legal publisher identity', env, 'NEXT_PUBLIC_PUBLICATION_LEGAL_NAME', {
      required: live,
    }),
    verifiedSetting('editor-in-chief', 'Editor-in-chief identity', env, 'NEXT_PUBLIC_EDITOR_IN_CHIEF', {
      required: live,
    }),
    verifiedSetting('registration', 'Publication registration', env, 'NEXT_PUBLIC_DOIB_NUMBER', {
      required: live,
    }),
    verifiedSetting('newsroom-contact', 'Newsroom address', env, 'NEXT_PUBLIC_NEWSROOM_ADDRESS', {
      required: live,
    }),
    verifiedSetting('newsroom-email', 'Newsroom email', env, 'NEXT_PUBLIC_NEWSROOM_EMAIL', {
      required: live,
    }),
    verifiedSetting('newsroom-phone', 'Newsroom phone', env, 'NEXT_PUBLIC_NEWSROOM_PHONE', {
      required: live,
    }),
    {
      key: 'content-volume',
      label: 'Published content threshold',
      status: publishedCount >= launchMinimum ? 'pass' : live ? 'fail' : 'warn',
      detail: `${publishedCount}/${launchMinimum} verified published articles declared`,
    },
    {
      key: 'email',
      label: 'Email provider',
      status: emailReady(env) ? 'pass' : live ? 'fail' : 'warn',
      detail: emailReady(env)
        ? 'Outbound email provider is configured'
        : 'Set RESEND_API_KEY or NEWSLETTER_API_KEY + NEWSLETTER_API_BASE',
    },
    verifiedSetting('auth-email-from', 'Account email sender', env, 'AUTH_EMAIL_FROM', {
      required: live,
    }),
    verifiedSetting('newsletter-from', 'Newsletter sender', env, 'NEWSLETTER_FROM', {
      required: live,
    }),
    {
      key: 'storage',
      label: 'Media storage',
      status:
        contentSource === 'payload'
          ? blobReady
            ? 'pass'
            : live
              ? 'fail'
              : 'warn'
          : webMediaUploadReady
            ? 'pass'
            : live
              ? 'fail'
              : 'warn',
      detail:
        contentSource === 'payload'
          ? blobReady
            ? 'Payload media uploads use durable Vercel Blob storage'
            : 'Attach a Blob store to the Payload project so BLOB_READ_WRITE_TOKEN exists'
          : blobReady
            ? 'Vercel Blob configured for newsroom photo uploads'
            : webMediaUploadReady
              ? 'Object storage configured for newsroom photo uploads'
              : 'Set BLOB_READ_WRITE_TOKEN (Vercel Blob) or R2 + STORAGE_PUBLIC_BASE_URL before heavy photo desk work',
    },
    {
      key: 'analytics',
      label: 'Audience analytics',
      status:
        envValue(env, 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN') || envValue(env, 'NEXT_PUBLIC_GA4_ID')
          ? 'pass'
          : 'warn',
      detail:
        envValue(env, 'NEXT_PUBLIC_PLAUSIBLE_DOMAIN') || envValue(env, 'NEXT_PUBLIC_GA4_ID')
          ? 'Audience analytics configured'
          : 'Trending and Most Read remain conservative until verified telemetry is configured',
    },
    {
      key: 'error-monitoring',
      label: 'Error monitoring (Sentry)',
      status: sentryDsn ? 'warn' : live ? 'fail' : 'warn',
      detail: sentryDsn
        ? 'SENTRY_DSN is set; SDK initialization is confirmed by the live probe'
        : 'SENTRY_DSN unset. Errors log to console only.',
    },
    {
      key: 'network-ads',
      label: 'Network advertising credentials',
      status:
        ads !== 'network' ? 'pass' : networkAdsReady ? 'pass' : live ? 'fail' : 'warn',
      detail:
        ads !== 'network'
          ? ads === 'house'
            ? 'House ads mode — labeled creatives expected for soft launch revenue'
            : 'Ads mode is off; soft launch may use NEXT_PUBLIC_ADS_MODE=house when creatives exist'
          : networkAdsReady
            ? 'Network ads mode has matching publisher credentials'
            : 'NEXT_PUBLIC_ADS_MODE=network but AdSense client or GAM network code is missing',
    },
    {
      key: 'house-ads-soft',
      label: 'Soft-launch ads path',
      status: 'pass',
      detail:
        ads === 'off'
          ? 'Option A free-to-read with ads off is allowed for soft launch; set house mode when creatives are ready'
          : ads === 'house'
            ? 'House ads mode — verify active creatives in /admin/ads (async check enriches this)'
            : `Ads mode is ${ads}`,
    },
    {
      key: 'ad-sales-email',
      label: 'Advertising sales identity',
      status:
        ads === 'off' || envValue(env, 'NEXT_PUBLIC_AD_SALES_EMAIL')
          ? 'pass'
          : live
            ? 'fail'
            : 'warn',
      detail:
        ads === 'off'
          ? 'Ads are off; sales email is not required'
          : envValue(env, 'NEXT_PUBLIC_AD_SALES_EMAIL')
            ? 'NEXT_PUBLIC_AD_SALES_EMAIL is configured'
            : 'Advertising sales email is missing while ads are enabled',
    },
    {
      key: 'tts-provider',
      label: 'Article TTS provider',
      status: envValue(env, 'TTS_API_KEY') || envValue(env, 'NEXT_PUBLIC_TTS_PROVIDER') ? 'pass' : 'warn',
      detail:
        envValue(env, 'TTS_API_KEY') || envValue(env, 'NEXT_PUBLIC_TTS_PROVIDER')
          ? 'TTS provider env is present'
          : 'Article TTS remains optional until a provider is configured',
    },
    {
      key: 'semantic-search',
      label: 'Semantic search provider',
      status: envValue(env, 'OPENAI_API_KEY') || envValue(env, 'SEMANTIC_SEARCH_URL') ? 'pass' : 'warn',
      detail:
        envValue(env, 'OPENAI_API_KEY') || envValue(env, 'SEMANTIC_SEARCH_URL')
          ? 'Semantic search provider env is present'
          : 'Lexical search remains the public default until a semantic provider is configured',
    },
    {
      key: 'background-push',
      label: 'Background browser notifications',
      status: pushConfigured ? 'pass' : 'warn',
      detail: pushConfigured
        ? 'VAPID subscription and provider-backed push delivery are configured'
        : 'Web Push is post-soft-launch (P2); in-app alerts work without VAPID',
    },
    {
      key: 'notification-cron',
      label: 'Ops / scheduled-publish cron secret',
      status:
        envValue(env, 'CRON_SECRET').length >= 32 && !looksUnverified(envValue(env, 'CRON_SECRET'))
          ? 'pass'
          : live
            ? 'fail'
            : 'warn',
      detail:
        envValue(env, 'CRON_SECRET').length >= 32 && !looksUnverified(envValue(env, 'CRON_SECRET'))
          ? 'CRON_SECRET configured (≥32 chars) for GitHub ops-crons / scheduled-publish'
          : 'CRON_SECRET (≥32 chars) is required for GitHub Actions ops-crons (scheduled-publish every 5 min). Without it, scheduled workflow promotion, notifications, and deterministic cache revalidation are not guaranteed.',
    },
    {
      key: 'payments',
      label: 'Payment provider',
      status: envValue(env, 'STRIPE_SECRET_KEY') ? 'pass' : 'warn',
      detail: envValue(env, 'STRIPE_SECRET_KEY')
        ? 'Stripe secret is configured'
        : 'Payments remain optional on Option A; membership chrome stays off',
    },
    {
      key: 'staff-mfa',
      label: 'Staff multi-factor authentication',
      status: envValue(env, 'STAFF_MFA_ENABLED').toLowerCase() === 'true' ? 'pass' : live ? 'fail' : 'warn',
      detail:
        envValue(env, 'STAFF_MFA_ENABLED').toLowerCase() === 'true'
          ? 'Staff MFA is configured and enforced'
          : live
            ? 'Live mode is enabled, but mandatory staff MFA is not enforced'
            : 'Staff MFA is available but not enforced; set STAFF_MFA_ENABLED=true before launch',
    },
    {
      key: 'abuse-captcha',
      label: 'Turnstile on public writes',
      status: captcha.enabled ? 'pass' : live ? 'fail' : 'warn',
      detail: captcha.enabled
        ? 'CAPTCHA_PROVIDER=turnstile with site + secret keys'
        : captcha.unsupported
          ? 'CAPTCHA_PROVIDER must be turnstile'
          : live
            ? 'Live mode requires Turnstile on contact, newsletter, and submissions'
            : 'Set CAPTCHA_PROVIDER=turnstile + NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY before hard launch',
    },
    {
      key: 'live-data',
      label: 'Live data providers',
      status: envValue(env, 'FOOTBALL_API_KEY') || envValue(env, 'NEPSE_API_URL') ? 'pass' : 'warn',
      detail:
        envValue(env, 'FOOTBALL_API_KEY') || envValue(env, 'NEPSE_API_URL')
          ? 'At least one configured live provider is available'
          : 'Manual newsroom overrides are required for unsupported live data',
    },
    {
      key: 'auth-auto-migrate',
      label: 'Auth schema auto-migration',
      status: envValue(env, 'AUTH_AUTO_MIGRATE').toLowerCase() === 'true' ? (live ? 'fail' : 'warn') : 'pass',
      detail:
        envValue(env, 'AUTH_AUTO_MIGRATE').toLowerCase() === 'true'
          ? 'AUTH_AUTO_MIGRATE must be false in production; migrate auth schema before serve'
          : 'Auth auto-migration is not forced on',
    },
    verifiedSetting('submission-ip-salt', 'Submission IP salt', env, 'SUBMISSION_IP_SALT', {
      secret: true,
      required: live,
      warning: 'SUBMISSION_IP_SALT must be a non-placeholder secret of at least 32 characters',
    }),
    {
      key: 'partner-feed-tokens',
      label: 'Partner syndication tokens',
      status: envValue(env, 'PARTNER_FEED_TOKENS') ? 'pass' : live ? 'fail' : 'warn',
      detail: envValue(env, 'PARTNER_FEED_TOKENS')
        ? 'PARTNER_FEED_TOKENS configured; unauthorized partner.json requests fail closed'
        : 'PARTNER_FEED_TOKENS is required to prevent an unauthenticated syndication feed',
    },
    {
      key: 'boot-passwords',
      label: 'Boot-account passwords cleared',
      status:
        envValue(env, 'NEWSROOM_SUPERADMIN_PASSWORD') || envValue(env, 'NEWSROOM_ADMIN_PASSWORD')
          ? live
            ? 'fail'
            : 'warn'
          : 'pass',
      detail:
        envValue(env, 'NEWSROOM_SUPERADMIN_PASSWORD') || envValue(env, 'NEWSROOM_ADMIN_PASSWORD')
          ? 'Clear NEWSROOM_SUPERADMIN_PASSWORD and NEWSROOM_ADMIN_PASSWORD after boot-account provisioning'
          : 'Boot-account password env vars are not set',
    },
    {
      key: 'cms-health',
      label: 'Payload CMS deployment health',
      status: contentSource === 'payload' || live ? 'warn' : 'pass',
      detail:
        contentSource === 'payload' || live
          ? 'CMS /healthz not probed from the env gate — /admin/launch overlays live status'
          : 'Payload health is a hard-cutover probe',
    },
    {
      key: 'security-headers',
      label: 'Security response headers',
      status: 'warn',
      detail: 'Security header configuration not probed',
    },
  ]
}

export function launchGateExitCode(checks: LaunchCheck[], live: boolean): number {
  const fails = checks.filter((check) => check.status === 'fail')
  if (live) return fails.length > 0 ? 1 : 0
  return fails.some((check) => PREVIEW_ENFORCED_FAIL_KEYS.has(check.key)) ? 1 : 0
}

export function liveBlockerMessages(checks: LaunchCheck[]): string[] {
  return checks.filter((check) => check.status === 'fail').map((check) => check.detail)
}

export function inRepoLaunchProgramComplete(checks: LaunchCheck[]): boolean {
  return checks
    .filter((check) => !OPERATOR_OWNED_CHECK_KEYS.has(check.key))
    .every((check) => check.status !== 'fail')
}
