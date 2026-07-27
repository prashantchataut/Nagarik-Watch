import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getLaunchChecksAsync, launchScore } from '@/lib/launch-readiness'
import { getOpsHealthSnapshot } from '@/lib/ops/health-snapshot'
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
          </p>
        </AdminCard>
        <AdminCard>
          <h2 className="admin-section-title" lang="ne">
            प्रकाशन अघिको नियम
          </h2>
          <p className="mt-2 text-meta leading-7 text-ink-soft" lang="ne">
            Fail भएका items सार्वजनिक लन्च अघि सच्याउनुपर्छ। Warn भएका items स्पष्ट UI लेबल वा manual fallback सहित मात्र देखाउनुहोस्। नक्कली लाइभ डाटा, नक्कली विज्ञापन र नक्कली पेवाल सार्वजनिक रूपमा नदेखाउनुहोस्।
          </p>
        </AdminCard>
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
      <h2 className="admin-section-title mb-3 mt-8">Ops health snapshot</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        <AdminCard>
          <p className="admin-section-title !text-[0.95rem]">Database pool</p>
          {ops.pool.configured ? (
            <>
              <p className="mt-1 text-meta text-ink-soft">
                Saturation {pct(ops.pool.saturation)} · {ops.pool.totalCount}/{ops.pool.max} connections in use
                {ops.pool.waitingCount > 0 ? ` · ${ops.pool.waitingCount} waiting` : ''}
              </p>
            </>
          ) : (
            <p className="mt-1 text-meta text-ink-soft">No shared pool has been created in this process yet.</p>
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
                {job.label} — {job.lastRunAt ? `last ran ${job.ageMinutes !== null ? Math.round(job.ageMinutes) : '?'} min ago` : 'never recorded'}
              </p>
            ))}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
