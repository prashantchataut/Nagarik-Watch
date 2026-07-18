import 'server-only'
import { operationalStorageMode } from '@/lib/ops-db'
import { getEmailProviderState } from '@/lib/email-provider'
import { getOpsMigrationStatus } from '@/lib/ops-migrations'
import { getPaymentAdapterState } from '@/lib/payments/adapter'
import { isPayloadStorageWired } from '@/lib/storage-adapter'
import { twoFactorConfigured } from '@/lib/security/mfa'

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

function buildLaunchChecks(options?: {
  opsMigrations?: { applied: string[]; pending: string[]; storage: 'postgres' | 'unavailable' }
}): LaunchCheck[] {
  const dbMode = operationalStorageMode()
  const contentSource = value('CONTENT_SOURCE') || value('PAYLOAD_CONTENT_SOURCE')
  const emailProvider = getEmailProviderState()
  const publishedCount = Number(value('PUBLISHED_ARTICLE_COUNT') || 0)
  const launchMinimum = Number(value('LAUNCH_MIN_PUBLISHED_ARTICLES') || 30)
  const storageCredentialsPresent = Object.entries(process.env).some(
    ([name, current]) =>
      /^(STORAGE_|S3_|BLOB_)/.test(name) && Boolean(current?.trim()),
  )
  const storageAdapterWired = isPayloadStorageWired()
  const pushConfigured = Boolean(
    value('NEXT_PUBLIC_WEB_PUSH_VAPID_KEY') &&
      value('WEB_PUSH_PROVIDER_URL') &&
      value('WEB_PUSH_PROVIDER_API_KEY'),
  )
  const launchLive = (value('NEXT_PUBLIC_LAUNCH_STATUS') || 'preview').toLowerCase() === 'live'
  const ops = options?.opsMigrations
  const paymentAdapter = getPaymentAdapterState()

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
      status:
        contentSource === 'payload' || dbMode === 'postgres' || contentSource === 'json' || !contentSource
          ? 'pass'
          : 'fail',
      detail:
        contentSource === 'payload'
          ? 'Payload CMS is canonical'
          : dbMode === 'postgres'
            ? 'Newsroom article store uses Postgres (nw_articles)'
            : 'Local JSON article store (dev) — set DATABASE_URL for production',
    },
    verifiedSetting('payload-url', 'Payload CMS URL', 'PAYLOAD_PUBLIC_SERVER_URL', {
      required: contentSource === 'payload',
    }),
    verifiedSetting('payload-token', 'Payload service account', 'PAYLOAD_API_TOKEN', {
      required: contentSource === 'payload',
    }),
    verifiedSetting('payload-secret', 'Payload secret', 'PAYLOAD_SECRET', {
      secret: true,
      required: contentSource === 'payload',
    }),
    verifiedSetting('revalidation-secret', 'CMS revalidation secret', 'REVALIDATE_SECRET', {
      secret: true,
      required: contentSource === 'payload',
    }),
    {
      key: 'schema-migrations',
      label: 'Database migration mode',
      status:
        contentSource !== 'payload' || value('PAYLOAD_DB_PUSH') === 'false' ? 'pass' : 'fail',
      detail:
        contentSource !== 'payload'
          ? 'In-app article store does not require Payload migrations'
          : value('PAYLOAD_DB_PUSH') === 'false'
            ? 'Production schema push is disabled; checked-in migrations are authoritative'
            : 'Set PAYLOAD_DB_PUSH=false and run checked-in migrations before launch',
    },
    {
      key: 'ops-migrations',
      label: 'Operational schema migrations',
      status: !ops
        ? 'warn'
        : ops.storage === 'unavailable'
          ? launchLive || dbMode === 'postgres'
            ? 'fail'
            : 'warn'
          : ops.pending.length > 0
            ? launchLive
              ? 'fail'
              : 'warn'
            : 'pass',
      detail: !ops
        ? 'Ops migration status not probed'
        : ops.storage === 'unavailable'
          ? 'DATABASE_URL unavailable — run pnpm migrate:ops against Postgres before launch'
          : ops.pending.length > 0
            ? `Pending ops migrations: ${ops.pending.join(', ')} (pnpm migrate:ops)`
            : `${ops.applied.length} ops migrations applied`,
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
      status: contentSource !== 'payload' || storageAdapterWired ? 'pass' : 'warn',
      detail:
        contentSource !== 'payload'
          ? 'Media can be referenced by URL in the newsroom article editor'
          : storageAdapterWired
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
      status: paymentAdapter.ready ? 'pass' : 'warn',
      detail: paymentAdapter.ready
        ? `${paymentAdapter.provider} payment adapter reports ready`
        : paymentAdapter.detail,
    },
    {
      key: 'staff-mfa',
      label: 'Staff multi-factor authentication',
      status: twoFactorConfigured() ? 'pass' : launchLive ? 'warn' : 'pass',
      detail: twoFactorConfigured()
        ? 'Staff MFA is configured and enforced'
        : launchLive
          ? 'Live mode is enabled, but staff MFA is not configured or enforced'
          : 'Staff MFA is not configured; this becomes a warning in live mode',
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

/** Synchronous checks for static/scripts; ops migration probe is warn until async path runs. */
export function getLaunchChecks(): LaunchCheck[] {
  return buildLaunchChecks()
}

/** Preferred for /admin/launch — includes live ops migration status. */
export async function getLaunchChecksAsync(): Promise<LaunchCheck[]> {
  const opsMigrations = await getOpsMigrationStatus().catch(() => ({
    applied: [] as string[],
    pending: [] as string[],
    storage: 'unavailable' as const,
  }))
  return buildLaunchChecks({ opsMigrations })
}

export function launchScore(checks: LaunchCheck[]): number {
  const points = checks.reduce(
    (sum, check) => sum + (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0),
    0,
  )
  return Math.round((points / Math.max(1, checks.length)) * 100)
}
