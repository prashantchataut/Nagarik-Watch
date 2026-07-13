import type { Metadata } from 'next'
import { RECOMMENDER_VERSION } from '@nagarikwatch/db'
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
          <p className="mt-1 text-caption text-mute">{RECOMMENDER_VERSION}</p>
        </AdminCard>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">लागू भएका सुरक्षा नियम</h2>
          <ul className="mt-3 space-y-2 text-meta leading-relaxed text-ink-soft">
            <li>• हालै पढिएको, भविष्य मिति र do-not-recommend सामग्री हटाइन्छ।</li>
            <li>• प्रायोजित सामग्री सम्पादकीय सिफारिसमा पूर्वनिर्धारित रूपमा आउँदैन।</li>
            <li>• विभाग, लेखक र स्रोत दोहोरिने सीमा लागू हुन्छ।</li>
            <li>• प्रत्येक नतिजामा प्रमुख कारण र ranker version जोडिन्छ।</li>
          </ul>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Known boundary</h2>
          <p className="mt-2 text-meta leading-relaxed text-ink-soft">
            This is a transparent hybrid ranker, not a trained recommendation model. Collaborative filtering, embeddings, Bayesian experiments, conversion attribution and revenue LTV still require a consent-aware event store and sufficient traffic. They are not presented as live capabilities.
          </p>
        </AdminCard>
      </div>

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
