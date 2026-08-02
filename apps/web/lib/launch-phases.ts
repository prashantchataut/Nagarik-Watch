/**
 * Soft / hard launch phase checklists for /admin/launch.
 * These are operator runbook items — not automatic env probes.
 * See docs/launch-runbook.md.
 */
export type LaunchPhaseItem = {
  id: string
  label: string
  detail: string
}

export type LaunchPhase = {
  id: 'soft' | 'hard'
  title: string
  summary: string
  items: LaunchPhaseItem[]
}

export function getLaunchPhases(): LaunchPhase[] {
  return [
    {
      id: 'soft',
      title: 'Soft launch (preview)',
      summary:
        'Real product loops on Vercel Node with Payload content. Keep NEXT_PUBLIC_LAUNCH_STATUS=preview.',
      items: [
        {
          id: 'dns-vercel',
          label: 'Apex points at Vercel Node',
          detail: 'Cloudflare DNS → Vercel; not CF Pages static out (ADR-004).',
        },
        {
          id: 'payload-publish',
          label: 'Payload publish → public ≤60s',
          detail: 'CONTENT_SOURCE=payload + REVALIDATE_SECRET proven once.',
        },
        {
          id: 'corpus',
          label: '≥30 real Nepali stories',
          detail: 'No starter seed on homepage (ALLOW_STARTER_SEED unset).',
        },
        {
          id: 'auth-engagement',
          label: 'Auth + reading + comments + polls',
          detail: 'Postgres DATABASE_URL; consent cookie; moderation queue staffed.',
        },
        {
          id: 'cron',
          label: 'Scheduled-publish cron 48h green',
          detail: 'CRON_SECRET + ops-crons or Vercel cron heartbeat.',
        },
        {
          id: 'house-ads',
          label: 'House ads labeled (or ads off)',
          detail: 'NEXT_PUBLIC_ADS_MODE=house with creatives, or explicit off.',
        },
      ],
    },
    {
      id: 'hard',
      title: 'Hard launch (live)',
      summary: 'Flip live only when pnpm launch:gate passes with NEXT_PUBLIC_LAUNCH_STATUS=live.',
      items: [
        {
          id: 'legal',
          label: 'Verified DoIB / editor / contact in footer',
          detail: 'No pending/placeholder strings in NEXT_PUBLIC_* publication env.',
        },
        {
          id: 'mfa',
          label: 'Staff MFA enforced',
          detail: 'STAFF_MFA_ENABLED=true for all newsroom roles.',
        },
        {
          id: 'observability',
          label: 'Analytics + Sentry',
          detail: 'Plausible/GA4 behind consent; Sentry DSN receiving events.',
        },
        {
          id: 'turnstile',
          label: 'Turnstile on public writes',
          detail: 'CAPTCHA_PROVIDER=turnstile + site/secret keys.',
        },
        {
          id: 'gate',
          label: 'launch:gate zero blockers',
          detail: 'Run NEXT_PUBLIC_LAUNCH_STATUS=live pnpm launch:gate before announce.',
        },
      ],
    },
  ]
}
