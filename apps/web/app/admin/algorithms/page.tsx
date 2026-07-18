import type { Metadata } from 'next'
import Link from 'next/link'
import { RECOMMENDER_VERSION } from '@nagarikwatch/db'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  ALGORITHM_CATALOG,
  algorithmCatalogStats,
  rankAlgorithmsForShipping,
  type AlgorithmStatus,
} from '@/lib/algorithms/catalog'
import {
  bayesianAverage,
  banditExplorationScore,
  burstScore,
  ltvEngagementScore,
  rankStories,
  timeDecayScore,
  viralityScore,
  velocityScore,
  wilsonScore,
} from '@/lib/ranking'
import { buildStoryEngagementIndex, signalsForStory } from '@/lib/ranking-signals'
import { getStories } from '@/lib/content'
import { AdminCard, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Algorithms',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_CLASS: Record<AlgorithmStatus, string> = {
  live: 'bg-brand-tint text-brand-strong',
  partial: 'bg-amber-100 text-amber-900',
  scaffold: 'bg-surface text-ink-soft',
  blocked: 'bg-red-100 text-red-800',
  planned: 'bg-surface text-mute',
}

export default async function AlgorithmsPage() {
  await requireNewsroomSession()
  const [{ items }, engagement] = await Promise.all([
    getStories({ locale: 'ne', perPage: 24 }),
    buildStoryEngagementIndex(120),
  ])

  const ranked = rankStories(items, (story, index) =>
    signalsForStory(story, engagement, index),
  ).slice(0, 10)

  const stats = algorithmCatalogStats()
  const shipping = rankAlgorithmsForShipping(12)
  const sampleStory = ranked[0]
  const sampleSignals = sampleStory ? sampleStory.rankSignals : null
  const demoBayesian = sampleSignals
    ? bayesianAverage({
        clicks: sampleSignals.clicks,
        impressions: sampleSignals.impressions,
      })
    : 0
  const demoBandit = sampleSignals
    ? banditExplorationScore({
        impressions: sampleSignals.impressions,
        clicks: sampleSignals.clicks,
        totalImpressions: Math.max(1, engagement.totalImpressions),
      })
    : 0
  const demoLtv = sampleSignals ? ltvEngagementScore(sampleSignals) : 0
  const demoVirality = sampleSignals ? viralityScore(sampleSignals) : 0
  const demoWilson = wilsonScore(12, 2)

  return (
    <div>
      <AdminPageHeader
        title="एल्गोरिदम"
        subtitle="इमानदार क्याटलग — live भनेको वास्तविक कल साइट + स्कोर हो। blocked/planned लाई live भनी देखाउँदैन।"
        action={
          <Link
            href="/admin/live"
            className="inline-flex h-10 items-center rounded-md border border-rule px-3 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
          >
            लाइभ प्यानल →
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Catalog</p>
          <p className="mt-2 font-display text-display text-ink">{stats.total}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Live</p>
          <p className="mt-2 font-display text-display text-ink">{stats.live}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Partial</p>
          <p className="mt-2 font-display text-display text-ink">{stats.partial}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">
            2h activity
          </p>
          <p className="mt-2 font-display text-display text-ink">{engagement.sampleCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">
            Impressions
          </p>
          <p className="mt-2 font-display text-display text-ink">{engagement.totalImpressions}</p>
          <p className="mt-1 text-caption text-mute">{RECOMMENDER_VERSION}</p>
        </AdminCard>
      </section>

      <AdminCard className="mt-6">
        <h2 className="font-display text-h2 text-ink" lang="ne">
          अहिलेको र्‍याङ्किङ स्कोर
        </h2>
        <p className="mt-1 text-meta text-ink-soft" lang="en">
          Same engine as public hubs: weightedScore(timeDecay + velocity + burst + Bayesian CTR +
          UCB1 bandit + LTV + editorial).
        </p>
        <div className="mt-4 divide-y divide-rule overflow-x-auto">
          {ranked.map((story, index) => {
            const s = story.rankSignals
            return (
              <article
                key={story.slug}
                className="grid min-w-[36rem] gap-2 py-3 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center"
              >
                <span className="font-display text-h2 text-rule">{index + 1}</span>
                <div className="min-w-0">
                  <p className="truncate font-display text-body font-semibold text-ink" lang="ne">
                    {story.titleNe}
                  </p>
                  <p className="mt-1 text-caption text-mute">
                    decay {timeDecayScore(story.publishedAt).toFixed(1)} · vel{' '}
                    {velocityScore(s).toFixed(2)} · burst {burstScore(s).toFixed(2)} · CTR{' '}
                    {bayesianAverage({ clicks: s.clicks, impressions: s.impressions }).toFixed(3)} ·
                    bandit{' '}
                    {banditExplorationScore({
                      impressions: s.impressions,
                      clicks: s.clicks,
                      totalImpressions: Math.max(1, engagement.totalImpressions),
                    }).toFixed(3)}
                  </p>
                </div>
                <p className="font-mono text-meta font-bold text-brand-strong">
                  {story.rankScore.toFixed(1)}
                </p>
              </article>
            )
          })}
          {ranked.length === 0 ? (
            <p className="py-6 text-meta text-mute">No published stories to score yet.</p>
          ) : null}
        </div>
      </AdminCard>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Live function check</h2>
          <ul className="mt-3 space-y-2 text-meta text-ink-soft">
            <li>
              Bayesian CTR (top story):{' '}
              <strong className="text-ink">{demoBayesian.toFixed(4)}</strong>
            </li>
            <li>
              UCB1 bandit (top story): <strong className="text-ink">{demoBandit.toFixed(4)}</strong>
            </li>
            <li>
              LTV engagement: <strong className="text-ink">{demoLtv.toFixed(4)}</strong>
            </li>
            <li>
              Virality heuristic (not prediction):{' '}
              <strong className="text-ink">{demoVirality.toFixed(4)}</strong>
            </li>
            <li>
              Wilson score demo (12 up / 2 down):{' '}
              <strong className="text-ink">{demoWilson.toFixed(4)}</strong>
            </li>
          </ul>
          <p className="mt-3 text-caption text-mute">
            Zero impressions stay at the Bayesian prior — the score does not invent traffic.
          </p>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Ship-next ranking</h2>
          <ol className="mt-3 space-y-2 text-meta text-ink-soft">
            {shipping.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3">
                <span>
                  <strong className="text-ink">#{entry.number}</strong> {entry.label}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-caption font-bold ${STATUS_CLASS[entry.status]}`}
                >
                  {entry.status}
                </span>
              </li>
            ))}
          </ol>
        </AdminCard>
      </section>

      <section
        className="mt-6"
        aria-labelledby="all-algorithms-title"
        data-algorithm-count={ALGORITHM_CATALOG.length}
      >
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-rule pb-2">
          <h2 id="all-algorithms-title" className="font-display text-h2 text-ink">
            All algorithms
          </h2>
          <p className="text-meta text-mute">
            Showing all {ALGORITHM_CATALOG.length} catalog entries
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ALGORITHM_CATALOG.map((algorithm) => (
            <div key={algorithm.id} data-algorithm-id={algorithm.id}>
              <AdminCard className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
                    #{algorithm.number} · {algorithm.category}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-caption font-bold ${STATUS_CLASS[algorithm.status]}`}
                  >
                    {algorithm.status}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-h1 text-ink">{algorithm.label}</h2>
                <p className="mt-2 text-meta text-ink-soft">{algorithm.summary}</p>
                <p className="mt-2 text-caption text-mute">Surface: {algorithm.surface}</p>
                {algorithm.implementation ? (
                  <p className="mt-1 break-all text-caption text-mute">
                    {algorithm.implementation}
                  </p>
                ) : null}
                {algorithm.dependency ? (
                  <p className="mt-2 text-caption font-semibold text-amber-800">
                    Dependency: {algorithm.dependency}
                  </p>
                ) : null}
                <p className="mt-2 text-caption text-mute">Priority {algorithm.priority}</p>
              </AdminCard>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-5 text-caption text-mute">
        Catalog source: <code>lib/algorithms/catalog.ts</code> · scoring engine:{' '}
        <code>lib/ranking.ts</code> · search: <code>lib/search.ts</code>
      </p>
    </div>
  )
}
