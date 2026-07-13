import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { ACTIVE_ALGORITHM_REGISTRY, ALGORITHM_ROADMAP } from '@/lib/ranking'
import { AdminCard, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Algorithms',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const INSTRUMENTED = new Set([
  'weighted-scoring-ranker',
  'time-decay-ranking',
  'trending-detection',
  'velocity-ranking',
  'burst-detection',
  'wilson-score-ranking',
  'content-based-filtering',
  'session-based-recommendation',
])

export default async function AlgorithmsPage() {
  await requireNewsroomSession()
  const instrumented = ACTIVE_ALGORITHM_REGISTRY.filter((algorithm) => INSTRUMENTED.has(algorithm.id))

  return (
    <div>
      <AdminPageHeader
        title="एल्गोरिदम र परीक्षण"
        subtitle="Implemented scoring functions र वास्तवमै instrumented production signals छुट्टाछुट्टै देखाइएको छ"
      />
      <section className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Instrumented surfaces</p>
          <p className="mt-2 font-display text-display text-ink">{instrumented.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Available functions</p>
          <p className="mt-2 font-display text-display text-ink">{ACTIVE_ALGORITHM_REGISTRY.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Analytics status</p>
          <p className="mt-2 font-display text-h1 text-brand-strong">Partial</p>
        </AdminCard>
      </section>

      <AdminCard className="mt-6">
        <h2 className="font-display text-h2 text-ink">Known boundary</h2>
        <p className="mt-2 max-w-4xl text-meta leading-relaxed text-ink-soft">
          Recommendations, related stories, time decay, trending and reader-history signals are connected.
          Bayesian A/B assignment, conversion tracking, credible intervals, unique live visitors and revenue LTV still require a consent-aware event collector and experiment store. They are not presented as live metrics.
        </p>
      </AdminCard>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACTIVE_ALGORITHM_REGISTRY.map((algorithm) => {
          const live = INSTRUMENTED.has(algorithm.id)
          return (
            <AdminCard key={algorithm.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">{algorithm.id}</p>
                <span className={`rounded-full px-2 py-0.5 text-caption font-bold ${live ? 'bg-brand-tint text-brand-strong' : 'bg-surface text-mute'}`}>
                  {live ? 'instrumented' : 'function only'}
                </span>
              </div>
              <h2 className="mt-2 font-display text-h1 text-ink">{algorithm.label}</h2>
              <p className="mt-2 text-meta text-ink-soft">Surface: {algorithm.surface}</p>
            </AdminCard>
          )
        })}
      </section>

      <p className="mt-5 text-caption text-mute">Roadmap catalog entries: {ALGORITHM_ROADMAP.length}</p>
    </div>
  )
}
