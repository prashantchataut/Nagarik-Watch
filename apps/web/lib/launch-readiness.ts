import 'server-only'
import { operationalStorageMode } from '@/lib/ops-db'
import { getEmailProviderState } from '@/lib/email-provider'

export type LaunchCheck = {
  key: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail: string
}

function value(name: string): string {
  return process.env[name]?.trim() ?? ''
}

function looksUnverified(input: string): boolean {
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

function verifiedSetting(
  key: string,
  label: string,
  envName: string,
  options: { required?: boolean; secret?: boolean; warning?: string } = {},
): LaunchCheck {
  const current = value(envName)
  const invalid = looksUnverified(current) || (options.secret === true && current.length < 32)
  const required = options.required !== false
  return {
    key,
    label,
    status: invalid ? (required ? 'fail' : 'warn') : 'pass',
    detail: invalid ? options.warning ?? `${envName} is missing or still a placeholder` : `${envName} is configured`,
  }
}

export function getLaunchChecks(): LaunchCheck[] {
  const dbMode = operationalStorageMode()
  const contentSource = value('CONTENT_SOURCE') || value('PAYLOAD_CONTENT_SOURCE')
  const emailProvider = getEmailProviderState()
  const publishedCount = Number(value('PUBLISHED_ARTICLE_COUNT') || 0)
  const launchMinimum = Number(value('LAUNCH_MIN_PUBLISHED_ARTICLES') || 30)
  const storageCredentialsPresent = Boolean(value('BLOB_READ_WRITE_TOKEN') || value('S3_BUCKET') || value('STORAGE_BUCKET'))
  // Credentials are not proof of persistence. The current Payload config still
  // uses local upload storage, which is ephemeral on Vercel. Keep launch blocked
  // until a real Payload storage plugin is imported and configured.
  const storageAdapterWired = false
  const pushConfigured = Boolean(
    value('NEXT_PUBLIC_WEB_PUSH_VAPID_KEY') &&
      value('WEB_PUSH_PROVIDER_URL') &&
      value('WEB_PUSH_PROVIDER_API_KEY'),
  )

  return [
    verifiedSetting('site-url', 'Public site URL', 'NEXT_PUBLIC_SITE_URL'),
    verifiedSetting('auth-url', 'Better Auth URL', 'BETTER_AUTH_URL'),
    {
      key: 'database',
      label: 'Persistent database',
      status: dbMode === 'postgres' ? 'pass' : 'fail',
      detail: dbMode === 'postgres' ? 'DATABASE_URL points to Postgres' : 'Memory/PGlite mode is not production-safe',
    },
    verifiedSetting('auth-secret', 'Authentication secret', value('AUTH_SECRET') ? 'AUTH_SECRET' : 'BETTER_AUTH_SECRET', {
      secret: true,
    }),
    {
      key: 'content-source',
      label: 'Canonical content source',
      status: contentSource === 'payload' ? 'pass' : 'fail',
      detail: contentSource === 'payload' ? 'Payload CMS is canonical' : 'Set CONTENT_SOURCE=payload for production',
    },
    verifiedSetting('payload-url', 'Payload CMS URL', 'PAYLOAD_PUBLIC_SERVER_URL'),
    verifiedSetting('payload-token', 'Payload service account', 'PAYLOAD_API_TOKEN'),
    verifiedSetting('payload-secret', 'Payload secret', 'PAYLOAD_SECRET', { secret: true }),
    verifiedSetting('revalidation-secret', 'CMS revalidation secret', 'REVALIDATE_SECRET', { secret: true }),
    {
      key: 'schema-migrations',
      label: 'Database migration mode',
      status: value('PAYLOAD_DB_PUSH') === 'false' ? 'pass' : 'fail',
      detail: value('PAYLOAD_DB_PUSH') === 'false'
        ? 'Production schema push is disabled; checked-in migrations are authoritative'
        : 'Set PAYLOAD_DB_PUSH=false and run checked-in migrations before launch',
    },
    verifiedSetting('legal-name', 'Legal publisher identity', 'NEXT_PUBLIC_PUBLICATION_LEGAL_NAME'),
    verifiedSetting('editor-in-chief', 'Editor-in-chief identity', 'NEXT_PUBLIC_EDITOR_IN_CHIEF'),
    verifiedSetting('registration', 'Publication registration', 'NEXT_PUBLIC_DOIB_NUMBER'),
    verifiedSetting('newsroom-contact', 'Newsroom address', 'NEXT_PUBLIC_NEWSROOM_ADDRESS'),
    verifiedSetting('newsroom-email', 'Newsroom email', 'NEXT_PUBLIC_NEWSROOM_EMAIL'),
    verifiedSetting('newsroom-phone', 'Newsroom phone', 'NEXT_PUBLIC_NEWSROOM_PHONE'),
    {
      key: 'content-volume',
      label: 'Published content threshold',
      status: publishedCount >= launchMinimum ? 'pass' : 'warn',
      detail: `${publishedCount}/${launchMinimum} verified published articles declared`,
    },
    {
      key: 'email',
      label: 'Email provider',
      status: emailProvider.ready ? 'pass' : 'fail',
      detail: emailProvider.ready
        ? `${emailProvider.provider} email delivery is configured`
        : emailProvider.detail,
    },
    {
      key: 'storage',
      label: 'Media storage',
      status: storageAdapterWired ? 'pass' : 'fail',
      detail: storageAdapterWired
        ? 'Payload media uploads use durable object storage'
        : storageCredentialsPresent
          ? 'Storage credentials exist, but Payload still uses local ephemeral uploads; wire a supported storage adapter'
          : 'Payload still uses local ephemeral uploads; wire a supported storage adapter and credentials',
    },
    {
      key: 'analytics',
      label: 'Audience analytics',
      status: value('NEXT_PUBLIC_PLAUSIBLE_DOMAIN') || value('NEXT_PUBLIC_GA4_ID') ? 'pass' : 'warn',
      detail: value('NEXT_PUBLIC_PLAUSIBLE_DOMAIN') || value('NEXT_PUBLIC_GA4_ID')
        ? 'Audience analytics configured'
        : 'Trending and Most Read remain conservative until verified telemetry is configured',
    },
    {
      key: 'background-push',
      label: 'Background browser notifications',
      status: pushConfigured ? 'pass' : 'fail',
      detail: pushConfigured
        ? 'VAPID subscription and provider-backed push delivery are configured'
        : 'In-app alerts work, but background push needs a VAPID public key and an authenticated HTTPS delivery provider',
    },
    verifiedSetting('notification-cron', 'Notification delivery cron secret', 'CRON_SECRET', {
      secret: true,
    }),
    {
      key: 'payments',
      label: 'Payment provider',
      status: value('STRIPE_SECRET_KEY') || value('PAYMENT_PROVIDER') ? 'pass' : 'warn',
      detail: value('STRIPE_SECRET_KEY') || value('PAYMENT_PROVIDER')
        ? 'Payment provider configured'
        : 'Membership payments are not automated',
    },
    {
      key: 'live-data',
      label: 'Live data providers',
      status: value('FOOTBALL_API_KEY') || value('NEPSE_API_URL') ? 'pass' : 'warn',
      detail: value('FOOTBALL_API_KEY') || value('NEPSE_API_URL')
        ? 'At least one configured live provider is available'
        : 'Manual newsroom overrides are required for unsupported live data',
    },
  ]
}

export function launchScore(checks = getLaunchChecks()): number {
  const points = checks.reduce(
    (sum, check) => sum + (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0),
    0,
  )
  return Math.round((points / checks.length) * 100)
}
