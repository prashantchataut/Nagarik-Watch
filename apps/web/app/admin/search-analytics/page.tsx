import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getSearchAnalyticsSummary } from '@/lib/search-analytics'
import { AdminCard, AdminEmptyState, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Search Analytics',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function SearchAnalyticsPage() {
  await requireNewsroomSession()
  const summary = await getSearchAnalyticsSummary(30)

  return (
    <div>
      <AdminPageHeader
        subtitle="Consent-aware, privacy-scrubbed search demand and zero-result gaps · last 30 days"
      />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Searches</p>
          <p className="mt-2 font-display text-display text-ink">{summary.totalSearches}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">
            Zero results
          </p>
          <p className="mt-2 font-display text-display text-ink">{summary.zeroResultSearches}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">
            Zero-result rate
          </p>
          <p className="mt-2 font-display text-display text-ink">
            {(summary.zeroResultRate * 100).toFixed(1)}%
          </p>
        </AdminCard>
      </section>

      {summary.totalSearches === 0 ? (
        <div className="mt-6">
          <AdminEmptyState
            title="अहिलेसम्म खोज संकेत छैन"
            body="Analytics consent दिएका पाठकको खोज मात्र यहाँ आउँछ। ट्राफिक नभएसम्म कुनै query बनाइँदैन।"
          />
        </div>
      ) : (
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <AdminCard>
            <h2 className="font-display text-h2 text-ink">Top queries</h2>
            <div className="mt-3 divide-y divide-rule">
              {summary.topQueries.map((item) => (
                <div
                  key={item.query}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-meta"
                >
                  <span className="font-semibold text-ink">{item.query}</span>
                  <span className="text-ink-soft">{item.searches} searches</span>
                  <span className="text-mute">{item.averageResults.toFixed(1)} avg results</span>
                </div>
              ))}
            </div>
          </AdminCard>
          <AdminCard>
            <h2 className="font-display text-h2 text-ink">Zero-result opportunities</h2>
            <div className="mt-3 divide-y divide-rule">
              {summary.zeroResultQueries.map((item) => (
                <div
                  key={item.query}
                  className="flex items-center justify-between gap-4 py-3 text-meta"
                >
                  <span className="font-semibold text-ink">{item.query}</span>
                  <span className="text-mute">{item.searches} misses</span>
                </div>
              ))}
              {summary.zeroResultQueries.length === 0 ? (
                <p className="py-4 text-meta text-mute">No zero-result queries in this period.</p>
              ) : null}
            </div>
          </AdminCard>
        </section>
      )}
    </div>
  )
}

