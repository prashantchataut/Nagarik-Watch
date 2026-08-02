import 'server-only'
import { operationalStorageMode } from '@/lib/ops-db'
import { getEmailProviderState } from '@/lib/email-provider'
import { getOpsMigrationStatus } from '@/lib/ops-migrations'
import { getPaymentAdapterState } from '@/lib/payments/adapter'
import { isPayloadStorageWired } from '@/lib/storage-adapter'
import { twoFactorConfigured } from '@/lib/security/mfa'
import { lintSecurityHeaders } from '@/lib/security/header-lint'
import { getAdMode, isNetworkAdsReady } from '@/lib/ads'
import { getSentryState } from '@/lib/observability/sentry'
import { getTtsState } from '@/lib/ai/tts'
import { getSemanticProviderState } from '@/lib/ai/semantic-provider'

import baselineSecurityHeaders from '@/lib/security/baseline-headers.json'

/** Lints the shared baseline header list also applied by next.config.mjs. */
async function configuredSecurityHeaderLint(): Promise<ReturnType<typeof lintSecurityHeaders>> {
  const asRecord = Object.fromEntries(
    baselineSecurityHeaders.map((header) => [header.key.toLowerCase(), header.value]),
  )
  return lintSecurityHeaders(asRecord)
}

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
    detail: invalid
      ? (options.warning ?? `${envName} is missing or still a placeholder`)
      : `${envName} is configured`,
  }
}

function buildLaunchChecks(options?: {
  opsMigrations?: { applied: string[]; pending: string[]; storage: 'postgres' | 'unavailable' }
  securityHeaders?: ReturnType<typeof lintSecurityHeaders>
}): LaunchCheck[] {
  const dbMode = operationalStorageMode()
  const contentSource = value('CONTENT_SOURCE') || value('PAYLOAD_CONTENT_SOURCE')
  const emailProvider = getEmailProviderState()
  const publishedCount = Number(value('PUBLISHED_ARTICLE_COUNT') || 0)
  const launchMinimum = Number(value('LAUNCH_MIN_PUBLISHED_ARTICLES') || 30)
  const storageCredentialsPresent = Object.entries(process.env).some(
    ([name, current]) => /^(STORAGE_|S3_|BLOB_)/.test(name) && Boolean(current?.trim()),
  )
  const storageAdapterWired = isPayloadStorageWired()
  const blobUploadReady = Boolean(value('BLOB_READ_WRITE_TOKEN'))
  const objectStoragePublicBase = Boolean(
    value('STORAGE_PUBLIC_BASE_URL') || value('R2_PUBLIC_BASE_URL'),
  )
  const webMediaUploadReady = blobUploadReady || (storageCredentialsPresent && objectStoragePublicBase)
  const pushConfigured = Boolean(
    value('NEXT_PUBLIC_WEB_PUSH_VAPID_KEY') &&
    value('WEB_PUSH_VAPID_PRIVATE_KEY') &&
    value('WEB_PUSH_SUBJECT'),
  )
  const launchLive = (value('NEXT_PUBLIC_LAUNCH_STATUS') || 'preview').toLowerCase() === 'live'
  const ops = options?.opsMigrations
  const paymentAdapter = getPaymentAdapterState()
  const sentry = getSentryState()
  const tts = getTtsState()
  const semantic = getSemanticProviderState()
  const adsMode = getAdMode()

  return [
    verifiedSetting('site-url', 'Public site URL', 'NEXT_PUBLIC_SITE_URL'),
    verifiedSetting('auth-url', 'Better Auth URL', 'BETTER_AUTH_URL'),
    {
      key: 'database',
      label: 'Persistent database',
      status: dbMode === 'postgres' ? 'pass' : 'fail',
      detail:
        dbMode === 'postgres'
          ? 'DATABASE_URL points to Postgres'
          : 'Memory/PGlite mode is not production-safe',
    },
    verifiedSetting(
      'auth-secret',
      'Authentication secret',
      value('AUTH_SECRET') ? 'AUTH_SECRET' : 'BETTER_AUTH_SECRET',
      {
        secret: true,
      },
    ),
    {
      key: 'content-source',
      label: 'Canonical content source',
      status:
        contentSource === 'payload' ||
        dbMode === 'postgres' ||
        contentSource === 'json' ||
        !contentSource
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
      status: contentSource !== 'payload' || value('PAYLOAD_DB_PUSH') === 'false' ? 'pass' : 'fail',
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
      status:
        contentSource === 'payload'
          ? storageAdapterWired
            ? 'pass'
            : 'warn'
          : webMediaUploadReady
            ? 'pass'
            : launchLive || dbMode === 'postgres'
              ? 'fail'
              : 'warn',
      detail:
        contentSource === 'payload'
          ? storageAdapterWired
            ? 'Payload media uploads use durable object storage'
            : storageCredentialsPresent
              ? 'Storage credentials exist, but Payload still uses local ephemeral uploads; wire a supported storage adapter'
              : 'Payload still uses local ephemeral uploads; wire a supported storage adapter and credentials'
          : blobUploadReady
            ? 'Vercel Blob configured for newsroom photo uploads'
            : webMediaUploadReady
              ? 'Object storage configured for newsroom photo uploads'
              : 'Set BLOB_READ_WRITE_TOKEN (Vercel Blob) or R2 + STORAGE_PUBLIC_BASE_URL so editors can upload photos',
    },
    {
      key: 'analytics',
      label: 'Audience analytics',
      status:
        value('NEXT_PUBLIC_PLAUSIBLE_DOMAIN') || value('NEXT_PUBLIC_GA4_ID') ? 'pass' : 'warn',
      detail:
        value('NEXT_PUBLIC_PLAUSIBLE_DOMAIN') || value('NEXT_PUBLIC_GA4_ID')
          ? 'Audience analytics configured'
          : 'Trending and Most Read remain conservative until verified telemetry is configured',
    },
    {
      key: 'error-monitoring',
      label: 'Error monitoring (Sentry)',
      status: sentry.dsnConfigured ? 'pass' : 'warn',
      detail: sentry.detail,
    },
    {
      key: 'network-ads',
      label: 'Network advertising credentials',
      status:
        adsMode !== 'network' ? 'pass' : isNetworkAdsReady() ? 'pass' : launchLive ? 'fail' : 'warn',
      detail:
        adsMode !== 'network'
          ? `Ads mode is ${adsMode}; network scripts stay unloaded`
          : isNetworkAdsReady()
            ? 'Network ads mode has matching publisher credentials'
            : 'NEXT_PUBLIC_ADS_MODE=network but AdSense client or GAM network code is missing',
    },
    {
      key: 'tts-provider',
      label: 'Article TTS provider',
      status: tts.ready ? 'pass' : 'warn',
      detail: tts.detail,
    },
    {
      key: 'semantic-search',
      label: 'Semantic search provider',
      status: 'pass',
      detail: semantic.detail,
    },
    {
      key: 'background-push',
      label: 'Background browser notifications',
      status: pushConfigured ? 'pass' : 'fail',
      detail: pushConfigured
        ? 'VAPID subscription and provider-backed push delivery are configured'
        : 'In-app alerts work, but direct Web Push needs public/private VAPID keys and a contact subject',
    },
    verifiedSetting('notification-cron', 'Ops / scheduled-publish cron secret', 'CRON_SECRET', {
      secret: true,
      warning:
        'CRON_SECRET (≥24 chars) is required for GitHub Actions ops-crons (scheduled-publish every 5 min). Without it, scheduled articles stay dark.',
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
      status: twoFactorConfigured() ? 'pass' : launchLive ? 'fail' : 'warn',
      detail: twoFactorConfigured()
        ? 'Staff MFA is configured and enforced'
        : launchLive
          ? 'Live mode is enabled, but mandatory staff MFA is not enforced'
          : 'Staff MFA is available but not enforced; set STAFF_MFA_ENABLED=true before launch',
    },
    {
      key: 'live-data',
      label: 'Live data providers',
      status: value('FOOTBALL_API_KEY') || value('NEPSE_API_URL') ? 'pass' : 'warn',
      detail:
        value('FOOTBALL_API_KEY') || value('NEPSE_API_URL')
          ? 'At least one configured live provider is available'
          : 'Manual newsroom overrides are required for unsupported live data',
    },
    {
      key: 'security-headers',
      label: 'Security response headers',
      status: !options?.securityHeaders
        ? 'warn'
        : options.securityHeaders.missing.length === 0
          ? 'pass'
          : 'fail',
      detail: !options?.securityHeaders
        ? 'Security header configuration not probed'
        : options.securityHeaders.missing.length === 0
          ? `${options.securityHeaders.present}/${options.securityHeaders.needed} baseline security headers configured`
          : `Missing security headers: ${options.securityHeaders.missing.join(', ')}`,
    },
  ]
}

/** Synchronous checks for static/scripts; ops migration probe is warn until async path runs. */
export function getLaunchChecks(): LaunchCheck[] {
  return buildLaunchChecks()
}

/** Preferred for /admin/launch — includes live ops migration status + real article count. */
export async function getLaunchChecksAsync(): Promise<LaunchCheck[]> {
  const opsMigrations = await getOpsMigrationStatus().catch(() => ({
    applied: [] as string[],
    pending: [] as string[],
    storage: 'unavailable' as const,
  }))
  const securityHeaders = await configuredSecurityHeaderLint().catch(() => undefined)
  const checks = buildLaunchChecks({ opsMigrations, securityHeaders })

  let livePublished = 0
  try {
    const { getAdminDashboardSnapshot } = await import('@/lib/content/store/json-store')
    const snap = await getAdminDashboardSnapshot()
    livePublished = snap.publishedTotal
  } catch {
    livePublished = -1
  }
  const launchMinimum = Number(value('LAUNCH_MIN_PUBLISHED_ARTICLES') || 30)
  const declared = Number(value('PUBLISHED_ARTICLE_COUNT') || 0)
  const volumeIdx = checks.findIndex((check) => check.key === 'content-volume')
  if (volumeIdx >= 0) {
    const count = livePublished >= 0 ? livePublished : declared
    const source =
      livePublished >= 0 ? 'from article store' : 'declared via PUBLISHED_ARTICLE_COUNT only (store unread)'
    checks[volumeIdx] = {
      key: 'content-volume',
      label: 'Published content threshold',
      status: count >= launchMinimum ? 'pass' : livePublished === 0 ? 'fail' : 'warn',
      detail: `${count}/${launchMinimum} published articles (${source})`,
    }
  }

  return checks
}

export function launchScore(checks: LaunchCheck[]): number {
  const points = checks.reduce(
    (sum, check) => sum + (check.status === 'pass' ? 1 : check.status === 'warn' ? 0.5 : 0),
    0,
  )
  return Math.round((points / Math.max(1, checks.length)) * 100)
}
