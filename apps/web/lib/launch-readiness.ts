import 'server-only'
import { operationalStorageMode } from '@/lib/ops-db'
import { getEmailProviderState } from '@/lib/email-provider'
import { getOpsMigrationStatus } from '@/lib/ops-migrations'
import { getPaymentAdapterState } from '@/lib/payments/adapter'
import { isPayloadStorageWired } from '@/lib/storage-adapter'
import { twoFactorConfigured } from '@/lib/security/mfa'
import { getCaptchaState } from '@/lib/security/turnstile'
import { lintSecurityHeaders } from '@/lib/security/header-lint'
import { getAdMode, isNetworkAdsReady } from '@/lib/ads'
import { getSentryState } from '@/lib/observability/sentry'
import { getTtsState } from '@/lib/ai/tts'
import { getSemanticProviderState } from '@/lib/ai/semantic-provider'
import {
  evaluateLaunchEnvChecks,
  envValue,
  looksUnverified,
  type LaunchCheck,
} from '@/lib/launch-gate-core'
import baselineSecurityHeaders from '@/lib/security/baseline-headers.json'

export type { LaunchCheck } from '@/lib/launch-gate-core'

/** Lints the shared baseline header list also applied by next.config.mjs. */
async function configuredSecurityHeaderLint(): Promise<ReturnType<typeof lintSecurityHeaders>> {
  const asRecord = Object.fromEntries(
    baselineSecurityHeaders.map((header) => [header.key.toLowerCase(), header.value]),
  )
  return lintSecurityHeaders(asRecord)
}

function replaceCheck(checks: LaunchCheck[], key: string, next: LaunchCheck): LaunchCheck[] {
  const index = checks.findIndex((check) => check.key === key)
  if (index < 0) return [...checks, next]
  const copy = checks.slice()
  copy[index] = next
  return copy
}

function overlayModuleProbes(checks: LaunchCheck[]): LaunchCheck[] {
  const dbMode = operationalStorageMode()
  const emailProvider = getEmailProviderState()
  const sentry = getSentryState()
  const tts = getTtsState()
  const semantic = getSemanticProviderState()
  const adsMode = getAdMode()
  const captcha = getCaptchaState()
  const paymentAdapter = getPaymentAdapterState()
  const launchLive = (envValue(process.env, 'NEXT_PUBLIC_LAUNCH_STATUS') || 'preview').toLowerCase() === 'live'
  const contentSource =
    envValue(process.env, 'CONTENT_SOURCE') ||
    envValue(process.env, 'PAYLOAD_CONTENT_SOURCE') ||
    'payload'
  const authSecret =
    envValue(process.env, 'AUTH_SECRET') || envValue(process.env, 'BETTER_AUTH_SECRET')
  const newsroomAddress = envValue(process.env, 'NEXT_PUBLIC_NEWSROOM_ADDRESS')

  let next = checks
  next = replaceCheck(next, 'auth-secret', {
    key: 'auth-secret',
    label: 'Authentication secret',
    status:
      authSecret.length >= 32 && !looksUnverified(authSecret)
        ? 'pass'
        : launchLive
          ? 'fail'
          : 'warn',
    detail:
      authSecret.length >= 32 && !looksUnverified(authSecret)
        ? 'Authentication secret is configured'
        : 'AUTH_SECRET or BETTER_AUTH_SECRET with at least 32 characters is required before live launch',
  })
  next = replaceCheck(next, 'newsroom-contact', {
    key: 'newsroom-contact',
    label: 'Newsroom address',
    status: newsroomAddress && !looksUnverified(newsroomAddress) ? 'pass' : launchLive ? 'fail' : 'warn',
    detail:
      newsroomAddress && !looksUnverified(newsroomAddress)
        ? 'Verified newsroom address is configured'
        : 'NEXT_PUBLIC_NEWSROOM_ADDRESS must contain the operator-verified newsroom address before live launch',
  })
  next = replaceCheck(next, 'database', {
    key: 'database',
    label: 'Persistent database',
    status: dbMode === 'postgres' ? 'pass' : launchLive ? 'fail' : checks.find((c) => c.key === 'database')?.status ?? 'warn',
    detail:
      dbMode === 'postgres'
        ? 'DATABASE_URL points to Postgres'
        : 'Memory/PGlite mode is not production-safe',
  })
  next = replaceCheck(next, 'email', {
    key: 'email',
    label: 'Email provider',
    status: emailProvider.ready ? 'pass' : launchLive ? 'fail' : 'warn',
    detail: emailProvider.ready
      ? `${emailProvider.provider} email delivery is configured`
      : emailProvider.detail,
  })
  next = replaceCheck(next, 'storage', {
    key: 'storage',
    label: 'Media storage',
    status:
      contentSource === 'payload'
        ? isPayloadStorageWired()
          ? 'pass'
          : launchLive
            ? 'fail'
            : 'warn'
        : checks.find((check) => check.key === 'storage')?.status ?? 'warn',
    detail:
      contentSource === 'payload'
        ? isPayloadStorageWired()
          ? 'Payload media uploads use durable object storage'
          : 'Payload still uses local ephemeral uploads; wire a supported storage adapter and credentials'
        : (checks.find((check) => check.key === 'storage')?.detail ?? 'Media storage not configured'),
  })
  next = replaceCheck(next, 'error-monitoring', {
    key: 'error-monitoring',
    label: 'Error monitoring (Sentry)',
    status: sentry.ready ? 'pass' : sentry.dsnConfigured ? (launchLive ? 'fail' : 'warn') : launchLive ? 'fail' : 'warn',
    detail: sentry.detail,
  })
  next = replaceCheck(next, 'network-ads', {
    key: 'network-ads',
    label: 'Network advertising credentials',
    status:
      adsMode !== 'network' ? 'pass' : isNetworkAdsReady() ? 'pass' : launchLive ? 'fail' : 'warn',
    detail:
      adsMode !== 'network'
        ? adsMode === 'house'
          ? 'House ads mode — labeled creatives expected for soft launch revenue'
          : 'Ads mode is off; soft launch may use NEXT_PUBLIC_ADS_MODE=house when creatives exist'
        : isNetworkAdsReady()
          ? 'Network ads mode has matching publisher credentials'
          : 'NEXT_PUBLIC_ADS_MODE=network but AdSense client+slot or GAM network code is missing',
  })
  next = replaceCheck(next, 'tts-provider', {
    key: 'tts-provider',
    label: 'Article TTS provider',
    status: tts.ready ? 'pass' : 'warn',
    detail: tts.detail,
  })
  next = replaceCheck(next, 'semantic-search', {
    key: 'semantic-search',
    label: 'Semantic search provider',
    status: semantic.ready ? 'pass' : 'warn',
    detail: semantic.detail,
  })
  next = replaceCheck(next, 'payments', {
    key: 'payments',
    label: 'Payment provider',
    status: paymentAdapter.ready ? 'pass' : 'warn',
    detail: paymentAdapter.ready
      ? `${paymentAdapter.provider} payment adapter reports ready`
      : paymentAdapter.detail,
  })
  next = replaceCheck(next, 'staff-mfa', {
    key: 'staff-mfa',
    label: 'Staff multi-factor authentication',
    status: twoFactorConfigured() ? 'pass' : launchLive ? 'fail' : 'warn',
    detail: twoFactorConfigured()
      ? 'Staff MFA is configured and enforced'
      : launchLive
        ? 'Live mode is enabled, but mandatory staff MFA is not enforced'
        : 'Staff MFA is available but not enforced; set STAFF_MFA_ENABLED=true before launch',
  })
  next = replaceCheck(next, 'abuse-captcha', {
    key: 'abuse-captcha',
    label: 'Turnstile on public writes',
    status: captcha.enabled ? 'pass' : launchLive ? 'fail' : 'warn',
    detail: captcha.enabled
      ? 'CAPTCHA_PROVIDER=turnstile with site + secret keys'
      : captcha.reason === 'unsupported_provider'
        ? 'CAPTCHA_PROVIDER must be turnstile'
        : launchLive
          ? 'Live mode requires Turnstile on contact, newsletter, and submissions'
          : 'Set CAPTCHA_PROVIDER=turnstile + NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY before hard launch',
  })
  return next
}

/** Synchronous checks for static/scripts; ops migration probe is warn until async path runs. */
export function getLaunchChecks(): LaunchCheck[] {
  return overlayModuleProbes(evaluateLaunchEnvChecks(process.env))
}

/** Preferred for /admin/launch — includes live ops migration status + real article count. */
export async function getLaunchChecksAsync(): Promise<LaunchCheck[]> {
  const opsMigrations = await getOpsMigrationStatus().catch(() => ({
    applied: [] as string[],
    pending: [] as string[],
    storage: 'unavailable' as const,
  }))
  const securityHeaders = await configuredSecurityHeaderLint().catch(() => undefined)
  let checks = getLaunchChecks()
  const dbMode = operationalStorageMode()
  const launchLive =
    (envValue(process.env, 'NEXT_PUBLIC_LAUNCH_STATUS') || 'preview').toLowerCase() === 'live'

  checks = replaceCheck(checks, 'ops-migrations', {
    key: 'ops-migrations',
    label: 'Operational schema migrations',
    status:
      opsMigrations.storage === 'unavailable'
        ? launchLive || dbMode === 'postgres'
          ? 'fail'
          : 'warn'
        : opsMigrations.pending.length > 0
          ? launchLive || dbMode === 'postgres'
            ? 'fail'
            : 'warn'
          : 'pass',
    detail:
      opsMigrations.storage === 'unavailable'
        ? 'DATABASE_URL unavailable — run pnpm migrate:ops against Postgres before launch'
        : opsMigrations.pending.length > 0
          ? `Pending ops migrations: ${opsMigrations.pending.join(', ')} (pnpm migrate:ops)`
          : `${opsMigrations.applied.length} ops migrations applied`,
  })

  checks = replaceCheck(checks, 'security-headers', {
    key: 'security-headers',
    label: 'Security response headers',
    status: !securityHeaders
      ? 'warn'
      : securityHeaders.missing.length === 0
        ? 'pass'
        : 'fail',
    detail: !securityHeaders
      ? 'Security header configuration not probed'
      : securityHeaders.missing.length === 0
        ? `${securityHeaders.present}/${securityHeaders.needed} baseline security headers configured`
        : `Missing security headers: ${securityHeaders.missing.join(', ')}`,
  })

  let livePublished = 0
  try {
    const { getCanonicalAdminDashboardSnapshot } = await import('@/lib/content/admin-dashboard')
    const snap = await getCanonicalAdminDashboardSnapshot()
    livePublished = snap.publishedTotal
  } catch {
    livePublished = -1
  }
  const launchMinimum = Number(envValue(process.env, 'LAUNCH_MIN_PUBLISHED_ARTICLES') || 30)
  const declared = Number(envValue(process.env, 'PUBLISHED_ARTICLE_COUNT') || 0)
  const count = livePublished >= 0 ? livePublished : declared
  const source =
    livePublished >= 0
      ? 'from canonical content source'
      : 'declared via PUBLISHED_ARTICLE_COUNT only (canonical source unread)'
  checks = replaceCheck(checks, 'content-volume', {
    key: 'content-volume',
    label: 'Published content threshold',
    status: count >= launchMinimum ? 'pass' : livePublished === 0 || launchLive ? 'fail' : 'warn',
    detail: `${count}/${launchMinimum} published articles (${source})`,
  })

  try {
    const { getOpsHealthSnapshot } = await import('@/lib/ops/health-snapshot')
    const ops = await getOpsHealthSnapshot()
    const scheduled = ops.cron.find((job) => job.job === 'scheduled-publish')
    const neverCount = ops.cron.filter((job) => job.state === 'never').length
    const staleCount = ops.cron.filter((job) => job.state === 'stale').length
    const secretOk =
      envValue(process.env, 'CRON_SECRET').length >= 32 &&
      !looksUnverified(envValue(process.env, 'CRON_SECRET'))
    let status: LaunchCheck['status'] = 'pass'
    let detail = 'CRON_SECRET set and scheduled-publish heartbeat is fresh'
    if (!secretOk) {
      status = launchLive ? 'fail' : 'warn'
      detail =
        'CRON_SECRET (≥32 chars) required for GitHub ops-crons / scheduled-publish. Without it, scheduled workflow promotion, notifications, and deterministic cache revalidation are not guaranteed.'
    } else if (!scheduled || scheduled.state === 'never') {
      status = launchLive ? 'fail' : 'warn'
      detail = `CRON_SECRET set, but ${neverCount}/${ops.cron.length} jobs have never recorded a heartbeat (wire CRON_BASE_URL + GitHub ops-crons / Vercel crons, or POST /api/cron/scheduled-publish once)`
    } else if (scheduled.state === 'stale' || staleCount > 0) {
      status = launchLive ? 'fail' : 'warn'
      detail = `Cron heartbeats stale (${staleCount} overdue). Check ops-crons.yml secrets and vercel.json daily jobs.`
    } else if ((ops.scheduledPublishGreenHours ?? 0) < 48 && launchLive) {
      status = 'fail'
      detail = `Scheduled-publish green window is ${Math.round(ops.scheduledPublishGreenHours ?? 0)}h of the required 48h.`
    } else if ((ops.scheduledPublishGreenHours ?? 0) < 48) {
      status = 'warn'
      detail = `Scheduled-publish green window is ${Math.round(ops.scheduledPublishGreenHours ?? 0)}h; 48h is required before hard launch.`
    }
    checks = replaceCheck(checks, 'notification-cron', {
      key: 'notification-cron',
      label: 'Ops / scheduled-publish cron secret',
      status,
      detail,
    })
  } catch {
    // Keep sync CRON_SECRET probe if ops snapshot fails.
  }

  try {
    const adsMode = getAdMode()
    if (adsMode === 'house') {
      const { listHouseAds } = await import('@/lib/house-ads')
      const ads = await listHouseAds().catch(() => [])
      const active = ads.filter((ad) => ad.active).length
      checks = replaceCheck(checks, 'house-ads-soft', {
        key: 'house-ads-soft',
        label: 'Soft-launch ads path',
        status: active > 0 ? 'pass' : launchLive ? 'fail' : 'warn',
        detail:
          active > 0
            ? `House ads mode with ${active} active creative${active === 1 ? '' : 's'}`
            : 'NEXT_PUBLIC_ADS_MODE=house but no active creatives in /admin/ads — public slots collapse empty',
      })
    }
  } catch {
    // Keep sync house-ads probe if inventory lookup fails.
  }

  const payloadUrl =
    envValue(process.env, 'PAYLOAD_PUBLIC_SERVER_URL') || envValue(process.env, 'PAYLOAD_ADMIN_URL')
  if (payloadUrl && !looksUnverified(payloadUrl)) {
    try {
      const response = await fetch(`${payloadUrl.replace(/\/$/, '')}/healthz`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(4_000),
      })
      const body = (await response.json().catch(() => ({}))) as {
        status?: string
        content?: { publicArticles?: number; publicationDrift?: number; categories?: number }
        mediaUploadReady?: boolean
      }
      const drift = Number(body.content?.publicationDrift ?? 0)
      const publicArticles = Number(body.content?.publicArticles ?? 0)
      const ok =
        response.ok &&
        body.status === 'ok' &&
        drift === 0 &&
        publicArticles > 0 &&
        body.mediaUploadReady !== false
      checks = replaceCheck(checks, 'cms-health', {
        key: 'cms-health',
        label: 'Payload CMS deployment health',
        status: ok ? 'pass' : launchLive ? 'fail' : 'warn',
        detail: ok
          ? `CMS /healthz ok · ${publicArticles} public articles · publicationDrift=${drift}`
          : `CMS /healthz ${response.status}: status=${body.status ?? 'unknown'} drift=${drift} public=${publicArticles} media=${String(body.mediaUploadReady)}`,
      })
    } catch (error) {
      checks = replaceCheck(checks, 'cms-health', {
        key: 'cms-health',
        label: 'Payload CMS deployment health',
        status: launchLive ? 'fail' : 'warn',
        detail: `CMS /healthz unreachable: ${error instanceof Error ? error.message : String(error)}`,
      })
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
