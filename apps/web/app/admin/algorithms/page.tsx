import type { Metadata } from 'next'
import Link from 'next/link'
import { RECOMMENDER_VERSION } from '@nagarikwatch/db'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  ACTIVE_ALGORITHM_REGISTRY,
  ALGORITHM_ROADMAP,
  bayesianAverage,
  banditExplorationScore,
  burstScore,
  ltvEngagementScore,
  rankStories,
  timeDecayScore,
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

/** Algorithms that receive real first-party signals on public + admin surfaces. */
const LIVE = new Set([
  'weighted-scoring-ranker',
  'time-decay-ranking',
  'trending-detection',
  'velocity-ranking',
  'burst-detection',
  'bayesian-ranking',
  'multi-armed-bandit',
  'wilson-score-ranking',
  'content-based-filtering',
  'session-based-recommendation',
  'ltv-engagement-score',
])

export default async function AlgorithmsPage() {
  await requireNewsroomSession()
  const [{ items }, engagement] = await Promise.all([
    getStories({ locale: 'ne', perPage: 24 }),
    buildStoryEngagementIndex(120),
  ])

  const ranked = rankStories(items, (story, index) =>
    signalsForStory(story, engagement, index),
  ).slice(0, 10)

  const live = ACTIVE_ALGORITHM_REGISTRY.filter((a) => LIVE.has(a.id))
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
  const demoWilson = wilsonScore(12, 2)

  return (
    <div>
      <AdminPageHeader
        title="एल्गोरिदम"
        subtitle="लाइभ स्कोर — काल्पनिक ML होइन। पहिलो-पक्ष पढाइ, टिप्पणी, इम्प्रेसन र क्लिकबाट चल्छ।"
        action={
          <Link
            href="/admin/live"
            className="inline-flex h-10 items-center rounded-md border border-rule px-3 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
          >
            लाइभ प्यानल →
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Live surfaces</p>
          <p className="mt-2 font-display text-display text-ink">{live.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">2h activity</p>
          <p className="mt-2 font-display text-display text-ink">{engagement.sampleCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Stories w/ signal</p>
          <p className="mt-2 font-display text-display text-ink">{engagement.storyCount}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Impressions</p>
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
              Bayesian CTR (top story): <strong className="text-ink">{demoBayesian.toFixed(4)}</strong>
            </li>
            <li>
              UCB1 bandit (top story): <strong className="text-ink">{demoBandit.toFixed(4)}</strong>
            </li>
            <li>
              LTV engagement: <strong className="text-ink">{demoLtv.toFixed(4)}</strong>
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
          <h2 className="font-display text-h2 text-ink">Safety rails</h2>
          <ul className="mt-3 space-y-2 text-meta leading-relaxed text-ink-soft">
            <li>• do-not-recommend and sponsored penalties remain enforced.</li>
            <li>• Public ranking never fabricates popularity when signals are empty.</li>
            <li>• Impression/click/share events require reader analytics or personalisation consent.</li>
            <li>• Comments enter the signal only after moderation approval.</li>
          </ul>
        </AdminCard>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACTIVE_ALGORITHM_REGISTRY.map((algorithm) => {
          const liveAlg = LIVE.has(algorithm.id)
          return (
            <AdminCard key={algorithm.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
                  {algorithm.id}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-caption font-bold ${
                    liveAlg ? 'bg-brand-tint text-brand-strong' : 'bg-surface text-mute'
                  }`}
                >
                  {liveAlg ? 'live' : 'roadmap'}
                </span>
              </div>
              <h2 className="mt-2 font-display text-h1 text-ink">{algorithm.label}</h2>
              <p className="mt-2 text-meta text-ink-soft">Surface: {algorithm.surface}</p>
            </AdminCard>
          )
        })}
      </section>

      <p className="mt-5 text-caption text-mute">
        Catalog ids: {ALGORITHM_ROADMAP.length} · all scoring functions exported from{' '}
        <code>lib/ranking.ts</code>
      </p>
    </div>
  )
}
