import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getLaunchChecksAsync, launchScore } from '@/lib/launch-readiness'
import { getLaunchStatusSummary } from '@/lib/launch-phases'
import { getOpsHealthSnapshot } from '@/lib/ops/health-snapshot'
import { getPayloadCutoverChecklist } from '@/lib/content/payload-cutover'
import { AdminPageHeader, AdminCard, OpsCheckBadge, AdminCallout } from '@/components/admin/primitives'

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
  const score = launchScore(checks)
  const status = getLaunchStatusSummary(checks, score)
  return (
    <div>
      <AdminPageHeader subtitle="Production gate before showing the client a serious build" />
      <div className="mb-5 grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <AdminCard>
          <p className="admin-metric__label">Readiness</p>
          <p className="admin-metric__value admin-metric__value--brand !text-[3.25rem]">{score}%</p>
          <p className="mt-2 text-meta text-ink-soft">
            Env score from automatic probes. Soft {status.soft.passCount}/
            {status.soft.items.length} · Hard {status.hard.passCount}/{status.hard.items.length} ·{' '}
            {status.failCount} fail · {status.warnCount} warn
          </p>
        </AdminCard>
        <AdminCard>
          <p className="admin-metric__label">Current stage</p>
          <p className="mt-1 text-[1.35rem] font-semibold text-ink">{status.stageLabel}</p>
          <p className="mt-2 text-meta leading-7 text-ink-soft">{status.nextAction}</p>
          <p className="mt-2 text-caption text-mute">
            Status: {status.launchStatus} · In-repo program: complete · Remaining: operator env,
            DNS, corpus, legal
          </p>
        </AdminCard>
      </div>

      <AdminCallout tone={status.failCount > 0 ? 'danger' : 'attention'} className="mb-6">
        <p className="text-meta leading-7">
          {status.inRepoComplete
            ? 'Code and docs for the launch program are in place. Clearing fails/warns requires Vercel secrets, Payload cutover, real stories, and verified publication identity — not more homepage polish.'
            : 'In-repo launch work is incomplete.'}{' '}
          Runbook: <code className="text-caption">docs/launch-runbook.md</code>
        </p>
      </AdminCallout>

      <h2 className="admin-section-title mb-3">Soft → hard phases</h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {[status.soft, status.hard].map((phase) => (
          <AdminCard key={phase.id}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="admin-section-title !text-[1rem]">{phase.title}</h3>
              <OpsCheckBadge
                status={phase.failCount > 0 ? 'fail' : phase.warnCount > 0 ? 'warn' : 'pass'}
              />
            </div>
            <p className="mt-1 text-meta text-ink-soft">{phase.summary}</p>
            <p className="mt-1 text-caption text-mute">
              {phase.passCount} pass · {phase.warnCount} warn · {phase.failCount} fail
            </p>
            <ol className="mt-3 list-decimal space-y-3 pl-4 text-meta text-ink-soft">
              {phase.items.map((item) => (
                <li key={item.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{item.label}</span>
                    <OpsCheckBadge status={item.status} />
                  </div>
                  <span className="mt-0.5 block text-caption text-mute">{item.detail}</span>
                  <span className="mt-0.5 block text-caption text-mute">{item.evidence}</span>
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
      <AdminCallout tone="attention" className="mb-4">
        <p className="text-meta leading-7">
          Pool max is <strong>1 connection per Node instance</strong> (Aiven slot safety). Seeing 1/1
          in use while this page loads is normal — only <strong>waiting &gt; 0</strong> means pressure.
          Cron rows stay <strong>NEVER</strong> until Vercel daily crons and/or GitHub{' '}
          <code className="text-caption">ops-crons.yml</code> hit production with{' '}
          <code className="text-caption">CRON_SECRET</code> + <code className="text-caption">CRON_BASE_URL</code>.
          Local preview does not invent heartbeats.
        </p>
      </AdminCallout>
      <div className="grid gap-3 lg:grid-cols-2">
        <AdminCard>
          <p className="admin-section-title !text-[0.95rem]">Database pool</p>
          {ops.pool.configured ? (
            <>
              <p className="mt-1 text-meta text-ink-soft">
                {ops.pool.totalCount - ops.pool.idleCount}/{ops.pool.max} in use · {ops.pool.idleCount}{' '}
                idle · {ops.pool.waitingCount} waiting · saturation {pct(ops.pool.saturation)}
              </p>
              <p className="mt-1 text-caption text-mute">
                {ops.pool.waitingCount > 0
                  ? 'Waiting clients — pool pressure under load.'
                  : ops.pool.max === 1
                    ? 'Max 1/instance by design. Not an outage signal by itself.'
                    : 'No queue waiting.'}
              </p>
            </>
          ) : (
            <p className="mt-1 text-meta text-ink-soft">
              No shared pool has been created in this process yet.
            </p>
          )}
        </AdminCard>
        <AdminCard>
          <p className="admin-section-title !text-[0.95rem]">Cron heartbeats</p>
          <div className="mt-1 grid gap-1">
            {ops.cron.map((job) => {
              const badge =
                job.state === 'ok' ? 'pass' : job.state === 'stale' ? 'fail' : 'warn'
              const label =
                job.state === 'ok' ? 'OK' : job.state === 'stale' ? 'STALE' : 'NEVER'
              return (
                <p key={job.job} className="text-meta text-ink-soft">
                  <span
                    className={
                      job.state === 'ok'
                        ? 'font-bold text-brand-strong'
                        : job.state === 'stale'
                          ? 'font-bold text-breaking'
                          : 'font-bold text-ink-soft'
                    }
                  >
                    {label}
                  </span>{' '}
                  <OpsCheckBadge status={badge} /> {job.label} —{' '}
                  {job.lastRunAt
                    ? `last ran ${job.ageMinutes !== null ? Math.round(job.ageMinutes) : '?'} min ago`
                    : 'never recorded (scheduler not hitting this host yet)'}
                </p>
              )
            })}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
