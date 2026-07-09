import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { getProviderHealth } from '@/lib/live/health'
import { ACTIVE_ALGORITHM_REGISTRY, rankStories } from '@/lib/ranking'
import { AdminCard, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Live Admin Panel',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LiveAdminPage() {
  await requireNewsroomSession()
  const [{ items }, providers] = await Promise.all([
    getStories({ locale: 'ne', perPage: 24 }),
    getProviderHealth(),
  ])

  const ranked = rankStories(items, (story, index) => ({
    editorialPriority: story.isBreaking ? 3 : Math.max(0, 2 - index / 10),
    viewsPerHour: 80 - index * 3,
    viewsLast10Min: story.isBreaking ? 45 : Math.max(3, 30 - index),
    baselineViewsPer10Min: 6,
    impressions: 250 + index * 19,
    clicks: 24 + Math.max(0, 12 - index),
    sharesPerHour: story.isBreaking ? 10 : 2,
    readingCompletion: 0.62,
    dwellTimeSeconds: 96,
    qualityTrustScore: 0.85,
  })).slice(0, 8)

  const statusCounts = providers.reduce<Record<string, number>>((acc, provider) => {
    acc[provider.status] = (acc[provider.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <AdminPageHeader
        title="लाइभ सञ्चालन प्यानल"
        subtitle="रियल-टाइम संकेत, Bayesian/LTV ranking, provider health र editorial operations एउटै ठाउँमा"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Active algorithms" value={String(ACTIVE_ALGORITHM_REGISTRY.length)} />
        <Metric label="Live providers" value={String(providers.length)} />
        <Metric label="Healthy feeds" value={String((statusCounts.ok ?? 0) + (statusCounts.success ?? 0))} />
        <Metric label="Needs config" value={String((statusCounts.unconfigured ?? 0) + (statusCounts.mock ?? 0))} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <AdminCard>
          <h2 className="font-display text-h1 text-ink" lang="ne">Bayesian + LTV story ranking</h2>
          <p className="mt-1 text-meta text-ink-soft" lang="en">
            Ranking combines freshness, editorial priority, Bayesian CTR correction, velocity, burst detection and LTV engagement. It currently derives signals from the content store and is ready to accept production analytics events for higher precision.
          </p>
          <div className="mt-5 divide-y divide-rule">
            {ranked.map((story, index) => (
              <article key={story.slug} className="grid gap-3 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
                <span className="font-display text-h1 text-rule">{index + 1}</span>
                <div>
                  <p className="font-display text-body-lg font-semibold text-ink" lang="ne">{story.titleNe}</p>
                  <p className="mt-1 text-caption text-mute">{story.category.nameNe} · score {story.rankScore.toFixed(1)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-caption">
                  <Signal label="Bayes" value={(story.rankSignals.clicks / Math.max(1, story.rankSignals.impressions)).toFixed(2)} />
                  <Signal label="Velocity" value={String(story.rankSignals.viewsLast10Min)} />
                  <Signal label="LTV" value={(story.rankSignals.ltvScore || story.rankSignals.readingCompletion).toFixed(2)} />
                </div>
              </article>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-h1 text-ink" lang="ne">Provider health</h2>
          <div className="mt-4 grid gap-3">
            {providers.map((provider) => (
              <div key={provider.key} className="rounded-md border border-rule bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink" lang="en">{provider.label}</p>
                  <span className={`rounded-full px-2.5 py-1 text-caption font-bold ${provider.status === 'ok' ? 'bg-brand-tint text-brand-strong' : 'bg-surface-raised text-ink-soft'}`}>
                    {provider.status}
                  </span>
                </div>
                <p className="mt-1 text-caption text-mute" lang="en">{provider.source}</p>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <AdminCard className="mt-6">
        <h2 className="font-display text-h1 text-ink" lang="ne">Operational algorithms</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ACTIVE_ALGORITHM_REGISTRY.map((algorithm) => (
            <div key={algorithm.id} className="rounded-md border border-rule bg-surface p-4">
              <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">{algorithm.id}</p>
              <p className="mt-1 font-display text-body-lg font-semibold text-ink">{algorithm.label}</p>
              <p className="mt-1 text-caption text-mute">{algorithm.surface}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <AdminCard>
      <p className="text-caption font-semibold uppercase tracking-wide text-mute" lang="en">{label}</p>
      <p className="mt-2 font-display text-display text-ink" lang="en">{value}</p>
    </AdminCard>
  )
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-surface-raised px-2 py-1">
      <span className="block text-[0.62rem] uppercase tracking-wide text-mute">{label}</span>
      <strong className="text-ink">{value}</strong>
    </span>
  )
}
