import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getLaunchChecksAsync, launchScore } from '@/lib/launch-readiness'
import { getOpsHealthSnapshot } from '@/lib/ops/health-snapshot'
import { getPayloadCutoverChecklist } from '@/lib/content/payload-cutover'
import { getLaunchPhases } from '@/lib/launch-phases'
import { AdminPageHeader, AdminCard, OpsCheckBadge } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लन्च चेक',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export default async function LaunchPage() {
  await requireNewsroomSession()
  const [checks, ops] = await Promise.all([getLaunchChecksAsync(), getOpsHealthSnapshot()])
  const cutover = getPayloadCutoverChecklist()
  const phases = getLaunchPhases()
  const score = launchScore(checks)
  return (
    <div>
      <AdminPageHeader subtitle="Production gate before showing the client a serious build" />
      <div className="mb-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <AdminCard>
          <p className="admin-metric__label">Readiness</p>
          <p className="admin-metric__value admin-metric__value--brand !text-[3.25rem]">{score}%</p>
          <p className="mt-2 text-meta text-ink-soft">
            100% requires passing env, auth, persistent DB, storage, email and live data checks.
            Origin must be Vercel Node (ADR-004) — not CF Pages static.
          </p>
        </AdminCard>
        <AdminCard>
          <h2 className="admin-section-title" lang="ne">
            प्रकाशन अघिको नियम
          </h2>
          <p className="mt-2 text-meta leading-7 text-ink-soft" lang="ne">
            Fail भएका items सार्वजनिक लन्च अघि सच्याउनुपर्छ। Warn भएका items स्पष्ट UI लेबल वा manual
            fallback सहित मात्र देखाउनुहोस्। नक्कली लाइभ डाटा, नक्कली विज्ञापन र नक्कली पेवाल सार्वजनिक रूपमा
            नदेखाउनुहोस्।
          </p>
          <p className="mt-2 text-caption text-mute" lang="en">
            Runbook: docs/launch-runbook.md · Soft stay preview · Hard needs pnpm launch:gate
          </p>
        </AdminCard>
      </div>

      <h2 className="admin-section-title mb-3">Soft → hard phases</h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {phases.map((phase) => (
          <AdminCard key={phase.id}>
            <h3 className="admin-section-title !text-[1rem]">{phase.title}</h3>
            <p className="mt-1 text-meta text-ink-soft">{phase.summary}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-meta text-ink-soft">
              {phase.items.map((item) => (
                <li key={item.id}>
                  <span className="font-semibold text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-caption text-mute">{item.detail}</span>
                </li>
              ))}
            </ol>
          </AdminCard>
        ))}
      </div>

      <div className="grid gap-3">
        {checks.map((check) => (
          <AdminCard key={check.key} className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
            <OpsCheckBadge status={check.status} />
            <div>
              <p className="admin-section-title !text-[0.95rem]">{check.label}</p>
              <p className="text-meta text-ink-soft">{check.detail}</p>
            </div>
            <code className="text-caption text-mute">{check.key}</code>
          </AdminCard>
        ))}
      </div>

      <h2 className="admin-section-title mb-3 mt-8">Payload CMS cutover</h2>
      <AdminCard className="mb-5">
        <p className="text-meta text-ink-soft" lang="en">
          {cutover.currentlyCanonical
            ? 'CONTENT_SOURCE=payload is live. Public reads Payload; local desk article writes are blocked — publish in Payload.'
            : cutover.ready
              ? 'Gates look ready. Set CONTENT_SOURCE=payload only after the desk is trained on Payload and PAYLOAD_PUBLIC_SERVER_URL is set.'
              : 'Complete checks before flipping to Payload. Web desk + JSON is preview-only for launch.'}
        </p>
        <ul className="mt-3 divide-y divide-rule">
          {cutover.checks.map((check) => (
            <li key={check.key} className="flex items-start justify-between gap-3 py-2 text-meta">
              <span>
                <span className={check.ok ? 'font-bold text-brand-strong' : 'font-bold text-breaking'}>
                  {check.ok ? 'OK' : 'TODO'}
                </span>{' '}
                {check.label}
                <span className="mt-0.5 block text-caption text-mute">{check.detail}</span>
              </span>
              <code className="shrink-0 text-caption text-mute">{check.key}</code>
            </li>
          ))}
        </ul>
      </AdminCard>

      <h2 className="admin-section-title mb-3 mt-8">Ops health snapshot</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <AdminCard>
          <p className="admin-section-title !text-[0.95rem]">Database pool</p>
          {ops.pool.configured ? (
            <p className="mt-1 text-meta text-ink-soft">
              Saturation {pct(ops.pool.saturation)} · {ops.pool.totalCount}/{ops.pool.max} connections in
              use
              {ops.pool.waitingCount > 0 ? ` · ${ops.pool.waitingCount} waiting` : ''}
            </p>
          ) : (
            <p className="mt-1 text-meta text-ink-soft">
              No shared pool has been created in this process yet.
            </p>
          )}
        </AdminCard>
        <AdminCard>
          <p className="admin-section-title !text-[0.95rem]">Cron heartbeats</p>
          <div className="mt-1 grid gap-1">
            {ops.cron.map((job) => (
              <p key={job.job} className="text-meta text-ink-soft">
                <span className={job.missed ? 'font-bold text-breaking' : 'font-bold text-brand-strong'}>
                  {job.missed ? 'MISSED' : 'OK'}
                </span>{' '}
                {job.label} —{' '}
                {job.lastRunAt
                  ? `last ran ${job.ageMinutes !== null ? Math.round(job.ageMinutes) : '?'} min ago`
                  : 'never recorded'}
              </p>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
