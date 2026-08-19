/**
 * Soft / hard launch phase checklists for /admin/launch.
 * Static runbook items; pair with resolveLaunchPhases(checks) for live status.
 * See docs/launch-runbook.md.
 */
import type { LaunchCheck } from '@/lib/launch-readiness'
import { inRepoLaunchProgramComplete } from '@/lib/launch-gate-core'

export type LaunchPhaseItem = {
  id: string
  label: string
  detail: string
  /** Keys from getLaunchChecks used to auto-status this item. Empty = operator-only. */
  checkKeys: string[]
}

export type LaunchPhase = {
  id: 'soft' | 'hard'
  title: string
  summary: string
  items: LaunchPhaseItem[]
}

export type ResolvedLaunchPhaseItem = LaunchPhaseItem & {
  status: 'pass' | 'warn' | 'fail'
  evidence: string
}

export type ResolvedLaunchPhase = Omit<LaunchPhase, 'items'> & {
  items: ResolvedLaunchPhaseItem[]
  passCount: number
  warnCount: number
  failCount: number
  ready: boolean
}

export type LaunchStage = 'in-repo' | 'topology' | 'payload' | 'soft' | 'hard' | 'live'

export type LaunchStatusSummary = {
  launchStatus: 'preview' | 'live'
  score: number
  stage: LaunchStage
  stageLabel: string
  nextAction: string
  soft: ResolvedLaunchPhase
  hard: ResolvedLaunchPhase
  failCount: number
  warnCount: number
  /** Code/docs for the launch program are done; remaining work is operator env + content. */
  inRepoComplete: boolean
}

function rank(status: LaunchCheck['status']): number {
  switch (status) {
    case 'pass':
      return 0
    case 'warn':
      return 1
    case 'fail':
      return 2
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

function worstStatus(statuses: Array<LaunchCheck['status']>): LaunchCheck['status'] {
  if (statuses.length === 0) return 'warn'
  return statuses.reduce((worst, status) => (rank(status) > rank(worst) ? status : worst), 'pass')
}

export function getLaunchPhases(): LaunchPhase[] {
  return [
    {
      id: 'soft',
      title: 'Soft launch (preview)',
      summary:
        'Real product loops on Vercel Node. Soft path may use Postgres nw_articles / JSON desk; keep NEXT_PUBLIC_LAUNCH_STATUS=preview.',
      items: [
        {
          id: 'dns-vercel',
          label: 'Apex points at Vercel Node',
          detail: 'Cloudflare DNS → Vercel; not CF Pages static out (ADR-004).',
          checkKeys: ['origin-topology'],
        },
        {
          id: 'desk-publish',
          label: 'Desk publish path live',
          detail:
            'CONTENT_SOURCE=json + DATABASE_URL (nw_articles) for soft launch, or Payload when already cut over.',
          checkKeys: ['content-source', 'database', 'starter-seed'],
        },
        {
          id: 'corpus',
          label: '≥30 real Nepali stories',
          detail: 'No starter seed on homepage (ALLOW_STARTER_SEED unset).',
          checkKeys: ['content-volume', 'starter-seed'],
        },
        {
          id: 'auth-engagement',
          label: 'Auth + reading + comments + polls',
          detail: 'Postgres DATABASE_URL; consent cookie; moderation queue staffed.',
          checkKeys: ['database', 'auth-secret', 'email'],
        },
        {
          id: 'cron',
          label: 'Scheduled-publish cron 48h green',
          detail: 'CRON_SECRET + ops-crons or Vercel cron heartbeat.',
          checkKeys: ['notification-cron'],
        },
        {
          id: 'house-ads',
          label: 'House ads labeled (or ads off)',
          detail:
            'NEXT_PUBLIC_ADS_MODE=house with creatives, or explicit off for Option A soft launch.',
          checkKeys: ['house-ads-soft', 'network-ads'],
        },
      ],
    },
    {
      id: 'hard',
      title: 'Hard launch (live)',
      summary: 'Flip live only when pnpm launch:gate passes with NEXT_PUBLIC_LAUNCH_STATUS=live.',
      items: [
        {
          id: 'payload-cutover',
          label: 'Payload CMS cutover',
          detail: 'CONTENT_SOURCE=payload + URL + token + REVALIDATE_SECRET proven before live.',
          checkKeys: ['content-source', 'revalidation-secret', 'payload-url', 'payload-token'],
        },
        {
          id: 'legal',
          label: 'Verified DoIB / editor / contact in footer',
          detail: 'No pending/placeholder strings in NEXT_PUBLIC_* publication env.',
          checkKeys: [
            'legal-name',
            'editor-in-chief',
            'registration',
            'newsroom-contact',
            'newsroom-email',
            'newsroom-phone',
          ],
        },
        {
          id: 'mfa',
          label: 'Staff MFA enforced',
          detail: 'STAFF_MFA_ENABLED=true for all newsroom roles.',
          checkKeys: ['staff-mfa'],
        },
        {
          id: 'syndication',
          label: 'Partner feed fail-closed',
          detail: 'PARTNER_FEED_TOKENS required; unauthorized partner.json is 401.',
          checkKeys: ['partner-feed-tokens'],
        },
        {
          id: 'ops-secrets',
          label: 'Ops secrets and boot passwords',
          detail: 'Submission salt, auth auto-migrate off, boot passwords cleared, ad sales identity.',
          checkKeys: [
            'submission-ip-salt',
            'auth-auto-migrate',
            'boot-passwords',
            'ad-sales-email',
          ],
        },
        {
          id: 'cms-health',
          label: 'Payload /healthz green',
          detail: 'Database reachable, durable media, categories, corpus, publicationDrift=0.',
          checkKeys: ['cms-health'],
        },
        {
          id: 'observability',
          label: 'Analytics + Sentry',
          detail: 'Plausible/GA4 behind consent; Sentry DSN receiving events.',
          checkKeys: ['analytics', 'error-monitoring'],
        },
        {
          id: 'turnstile',
          label: 'Turnstile on public writes',
          detail: 'CAPTCHA_PROVIDER=turnstile + site/secret keys.',
          checkKeys: ['abuse-captcha'],
        },
        {
          id: 'gate',
          label: 'launch:gate zero blockers',
          detail: 'Run NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate before announce.',
          checkKeys: [],
        },
      ],
    },
  ]
}

export function resolveLaunchPhases(checks: LaunchCheck[]): ResolvedLaunchPhase[] {
  const byKey = new Map(checks.map((check) => [check.key, check]))

  return getLaunchPhases().map((phase) => {
    const items: ResolvedLaunchPhaseItem[] = phase.items.map((item) => {
      if (item.id === 'gate') {
        const fails = checks.filter((check) => check.status === 'fail')
        const launchLive =
          (process.env.NEXT_PUBLIC_LAUNCH_STATUS || 'preview').toLowerCase() === 'live'
        if (fails.length > 0) {
          return {
            ...item,
            status: 'fail',
            evidence: `${fails.length} readiness fail(s) — fix before launch:gate`,
          }
        }
        if (launchLive) {
          return {
            ...item,
            status: 'pass',
            evidence: 'No fail checks while live; confirm launch:gate was run on deploy',
          }
        }
        return {
          ...item,
          status: 'warn',
          evidence: 'Operator step: NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate',
        }
      }

      const related = item.checkKeys
        .map((key) => byKey.get(key))
        .filter((check): check is LaunchCheck => Boolean(check))

      if (related.length === 0) {
        return {
          ...item,
          status: 'warn',
          evidence: 'No automatic probe — confirm in runbook / ops snapshot',
        }
      }

      const status = worstStatus(related.map((check) => check.status))
      return {
        ...item,
        status,
        evidence: related.map((check) => `${check.key}:${check.status}`).join(' · '),
      }
    })

    const passCount = items.filter((item) => item.status === 'pass').length
    const warnCount = items.filter((item) => item.status === 'warn').length
    const failCount = items.filter((item) => item.status === 'fail').length

    return {
      ...phase,
      items,
      passCount,
      warnCount,
      failCount,
      ready: failCount === 0 && warnCount === 0,
    }
  })
}

export function getLaunchStatusSummary(checks: LaunchCheck[], score: number): LaunchStatusSummary {
  const [soft, hard] = resolveLaunchPhases(checks)
  if (!soft || !hard) {
    throw new Error('Expected soft and hard launch phases')
  }

  const launchStatus =
    (process.env.NEXT_PUBLIC_LAUNCH_STATUS || 'preview').toLowerCase() === 'live'
      ? 'live'
      : 'preview'

  const origin = checks.find((check) => check.key === 'origin-topology')
  const content = checks.find((check) => check.key === 'content-source')
  const failCount = checks.filter((check) => check.status === 'fail').length
  const warnCount = checks.filter((check) => check.status === 'warn').length

  let stage: LaunchStage
  let stageLabel: string
  let nextAction: string

  if (origin?.status === 'fail') {
    stage = 'topology'
    stageLabel = 'Phase 0 — topology'
    nextAction = 'Point apex at Vercel Node (not CF Pages static). See docs/CLOUDFLARE-DOMAIN.md.'
  } else if (content?.status === 'fail') {
    stage = 'payload'
    stageLabel = 'Phase 1 — Payload cutover required'
    nextAction =
      'Live mode needs CONTENT_SOURCE=payload + CMS URL/token. Soft preview may stay on Postgres nw_articles.'
  } else if (!soft.ready && soft.failCount > 0) {
    stage = 'soft'
    stageLabel = 'Phase 2 — soft launch blockers'
    nextAction = `Clear soft-phase fails (${soft.failCount}). Keep LAUNCH_STATUS=preview.`
  } else if (!soft.ready) {
    stage = 'soft'
    stageLabel = 'Phase 2 — soft launch (preview)'
    nextAction = `Resolve soft warns (${soft.warnCount}): corpus, cron heartbeat, email, or media storage.`
  } else if (launchStatus === 'live' && hard.ready) {
    stage = 'live'
    stageLabel = 'Live'
    nextAction = 'Monitor Sentry, Search Console, and cron heartbeats.'
  } else if (launchStatus === 'live') {
    stage = 'hard'
    stageLabel = 'Phase 3 — hard launch incomplete'
    nextAction = 'Live flag is on but hard gates are not green — fix fails or roll back to preview.'
  } else if (!hard.ready) {
    stage = 'hard'
    stageLabel = 'Phase 3 — hard launch prep'
    nextAction =
      'Fill verified legal/MFA/Turnstile/analytics, then NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate.'
  } else {
    stage = 'hard'
    stageLabel = 'Ready to flip live'
    nextAction = 'Run launch:gate with LAUNCH_STATUS=live, then set live on Vercel and announce.'
  }

  return {
    launchStatus,
    score,
    stage,
    stageLabel,
    nextAction,
    soft,
    hard,
    failCount,
    warnCount,
    inRepoComplete: inRepoLaunchProgramComplete(checks),
  }
}
