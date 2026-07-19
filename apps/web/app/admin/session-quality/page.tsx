import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getSessionQualityReport } from '@/lib/session-quality'
import { AdminCard, AdminEmptyState, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Session Quality',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SessionQualityPage() {
  await requireNewsroomSession()
  const report = await getSessionQualityReport()

  return (
    <div>
      <AdminPageHeader
        subtitle="Privacy-preserving 24-hour aggregate of measured dwell, completion, shares, and bookmarks."
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Stories</p>
          <p className="mt-2 font-display text-display text-ink">{report.totals.stories}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Avg dwell</p>
          <p className="mt-2 font-display text-display text-ink">
            {report.averages.dwellSeconds.toFixed(0)}s
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Completion</p>
          <p className="mt-2 font-display text-display text-ink">
            {(report.averages.completionRate * 100).toFixed(1)}%
          </p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Shares</p>
          <p className="mt-2 font-display text-display text-ink">{report.totals.shares}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Bookmarks</p>
          <p className="mt-2 font-display text-display text-ink">{report.totals.bookmarks}</p>
        </AdminCard>
      </section>

      {report.stories.length === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            title="अहिलेसम्म गुणस्तर संकेत छैन"
            body="Consent-aware reading and engagement traffic arrives only after real reader activity; this report invents no sessions."
          />
        </div>
      ) : (
        <AdminCard className="mt-6 overflow-x-auto">
          <h2 className="font-display text-h2 text-ink">Story quality heuristic</h2>
          <p className="mt-1 text-caption text-mute">
            Transparent weighted heuristic, not a predictive model. Reader counts are summed per story and are not site-wide uniques.
          </p>
          <div className="mt-4 min-w-[42rem] divide-y divide-rule">
            {report.stories.slice(0, 50).map((row) => (
              <div
                key={row.articleSlug}
                className="grid grid-cols-[1fr_repeat(5,auto)] items-center gap-5 py-3 text-meta"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{row.articleSlug}</p>
                  <p className="text-caption text-mute">{row.categorySlug || 'uncategorized'}</p>
                </div>
                <span>{row.averageDwellSeconds}s dwell</span>
                <span>{(row.completionRate * 100).toFixed(0)}% complete</span>
                <span>{row.shares} shares</span>
                <span>{row.bookmarks} saves</span>
                <strong className="font-mono text-brand-strong">{row.qualityScore.toFixed(3)}</strong>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  )
}
