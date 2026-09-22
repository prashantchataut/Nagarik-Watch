import type { Metadata } from 'next'
import { RECOMMENDER_VERSION } from '@nagarikwatch/db'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  ALGORITHM_CATALOG,
  algorithmCatalogStats,
  algorithmRoadmapNumberingStats,
  rankAlgorithmsForShipping,
  type AlgorithmEntry,
  type AlgorithmStatus,
} from '@/lib/algorithms/catalog'
import {
  algorithmRuntimeHonesty,
  algorithmRuntimeModeCounts,
  runAllAlgorithms,
  type AlgorithmRunResult,
} from '@/lib/algorithms/runtime'
import { productWiringFor } from '@/lib/algorithms/product-surfaces'
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
import { getOpsHealthSnapshot } from '@/lib/ops/health-snapshot'
import {
  AdminCard,
  AdminPageHeader,
  AdminButton,
  AdminMetric,
  OpsCheckBadge,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Algorithms',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_TONE: Record<AlgorithmStatus, 'success' | 'attention' | 'neutral' | 'danger'> = {
  live: 'success',
  partial: 'attention',
  scaffold: 'neutral',
  blocked: 'danger',
  planned: 'neutral',
}

export default async function AlgorithmsPage() {
  await requireNewsroomSession()
  const [{ items }, engagement, opsHealth] = await Promise.all([
    getStories({ locale: 'ne', perPage: 24 }),
    buildStoryEngagementIndex(120),
    getOpsHealthSnapshot(),
  ])
  const cron = opsHealth.cron[0]

  const ranked = rankStories(items, (story, index) =>
    signalsForStory(story, engagement, index),
  ).slice(0, 10)

  const stats = algorithmCatalogStats()
  const numbering = algorithmRoadmapNumberingStats()
  const runtimeResults = runAllAlgorithms()
  const modeCounts = algorithmRuntimeModeCounts(runtimeResults)
  const honesty = algorithmRuntimeHonesty(runtimeResults)
  const okCount = runtimeResults.filter((r) => r.ok).length
  const failCount = runtimeResults.length - okCount
  const resultsById = new Map(runtimeResults.map((r) => [r.id, r]))
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
        subtitle={`Catalog self-tests: ${okCount} ok / ${failCount} fail (fixture runners). Live traffic: ${engagement.sampleCount} samples across ${engagement.storyCount} stories in 2h — zeros mean no consented events, not invented ranks.`}
        action={
          <AdminButton href="/admin/live" variant="secondary">
            लाइभ प्यानल →
          </AdminButton>
        }
      />

      <section className="admin-metric-grid" aria-label="Algorithm catalog metrics">
        <AdminMetric value={stats.total} label="Catalog" />
        <AdminMetric value={okCount} label="Functional pass" tone="brand" />
        <AdminMetric value={failCount} label="Functional fail" tone="danger" />
        <AdminMetric value={modeCounts.production} label="Production" />
        <AdminMetric value={engagement.sampleCount} label="2h activity" />
        <AdminMetric value={engagement.totalImpressions} label="Impressions" />
      </section>
      <p className="mt-2 text-caption text-mute">{RECOMMENDER_VERSION}</p>

      <AdminCard className="mt-6">
        <h2 className="font-display text-h2 text-ink">Ops health snapshot</h2>
        <ul className="mt-3 grid gap-2 text-meta text-ink-soft sm:grid-cols-2">
          <li>
            Pool saturation:{' '}
            <strong className="text-ink">{opsHealth.pool.saturation.toFixed(2)}</strong>
            {opsHealth.pool.configured
              ? ` (${opsHealth.pool.totalCount - opsHealth.pool.idleCount}/${opsHealth.pool.max})`
              : ' · not configured'}
          </li>
          <li>
            Cron health: <strong className="text-ink">{(cron?.health ?? 0).toFixed(2)}</strong>
            {cron?.missed ? ' · missed window' : ''}
          </li>
          <li>
            Error budget:{' '}
            <strong className="text-ink">
              {opsHealth.errorBudget
                ? opsHealth.errorBudget.withinBudget
                  ? 'within budget'
                  : 'over budget'
                : 'not tracked'}
            </strong>
          </li>
          <li>
            Cron last run: <strong className="text-ink">{cron?.lastRunAt ?? 'never'}</strong>
          </li>
        </ul>
        <p className="mt-2 text-caption text-mute">Snapshot at {opsHealth.generatedAt}</p>
      </AdminCard>

      <AdminCard className="mt-6 border-brand/30 bg-brand-tint/40">
        <h2 className="font-display text-h2 text-ink">Functional execution</h2>
        <p className="mt-2 text-meta text-ink-soft">
          Server-side <code>runAllAlgorithms()</code> against dedicated registry handlers: {okCount}
          /{numbering.maxNumber} passed. Mode mix: production {modeCounts.production}, local{' '}
          {modeCounts.local}, adapter-ready {modeCounts['adapter-ready']}, adapter-disabled{' '}
          {modeCounts['adapter-disabled']}.
        </p>
        <p className="mt-2 text-meta text-ink-soft">
          Failures report <code>ok: false</code> with a reason — handlers never fake success after
          throw. Adapter modes still run local computation; they do not invent CDN/WAF/vendor
          traffic.
        </p>
        {/*
          The pass count above is a statement about the handlers, not about the
          site. These three are the ones an editor should read first.
        */}
        <dl className="mt-4 grid gap-3 border-t border-rule pt-3 text-meta sm:grid-cols-3">
          <div>
            <dt className="text-mute">Reader-facing</dt>
            <dd className="font-display text-h3 text-ink">
              {honesty.productWired}
              <span className="text-mute">/{honesty.total}</span>
            </dd>
            <p className="mt-1 text-caption text-mute">
              Something a reader reaches imports the implementing module — a page they load, a
              public API route their browser calls, or the cron that pushes to their device. A
              further {honesty.newsroomWired} are newsroom-facing — a desk page or admin route runs
              them, no reader render does — and {honesty.platformWired} ship as platform config
              (next.config, middleware, CSS, CI) that no module imports. The remaining{' '}
              {honesty.total - honesty.productWired - honesty.newsroomWired - honesty.platformWired}{' '}
              run here and nowhere else. Verified against the import graph by{' '}
              <code>lib/algorithms/wiring.test.ts</code>.
            </p>
          </div>
          <div>
            <dt className="text-mute">Fixture input</dt>
            <dd className="font-display text-h3 text-ink">
              {honesty.fixtureOnly}
              <span className="text-mute">/{honesty.total}</span>
            </dd>
            <p className="mt-1 text-caption text-mute">
              This panel passes no input, so those ran on <code>defaultFixtureFor(id)</code>. Their
              scores describe the fixture, not production.
            </p>
          </div>
          <div>
            <dt className="text-mute">Returned outputs</dt>
            <dd className="font-display text-h3 text-ink">
              {honesty.withOutputs}
              <span className="text-mute">/{honesty.total}</span>
            </dd>
            <p className="mt-1 text-caption text-mute">
              The rest report a score and a detail line only — enough to prove the handler runs, not
              enough to inspect what it decided.
            </p>
          </div>
        </dl>
        {engagement.sampleCount === 0 ? (
          <p className="mt-3 font-semibold text-amber-900">
            No ranking events were observed in the last two hours. Formula output below is a code
            check, not proof of production traffic.
          </p>
        ) : null}
      </AdminCard>

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
          <h2 className="font-display text-h2 text-ink">Formula sandbox</h2>
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
            This confirms the scoring functions execute. It does not prove that traffic,
            attribution, or outcomes exist in production.
          </p>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Priority sample</h2>
          <ol className="mt-3 space-y-2 text-meta text-ink-soft">
            {shipping.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3">
                <span>
                  <strong className="text-ink">#{entry.number}</strong> {entry.label}
                </span>
                <span className={`admin-status admin-status--${STATUS_TONE[entry.status]}`}>
                  {entry.status}
                </span>
              </li>
            ))}
          </ol>
        </AdminCard>
      </section>

      <section
        className="mt-6"
        aria-labelledby="functional-capabilities-title"
        data-algorithm-count={ALGORITHM_CATALOG.length}
      >
        <CatalogSection
          id="functional-capabilities-title"
          title="Product-functional capabilities"
          description={`${ALGORITHM_CATALOG.length} dedicated registry handlers with fixture pass/fail, mode, surface, and last detail. Scoring components and engineering capabilities are included — not 232 separate ML systems.`}
          entries={ALGORITHM_CATALOG}
          resultsById={resultsById}
        />
      </section>

      <p className="mt-5 text-caption text-mute">
        Catalog: <code>lib/algorithms/catalog.ts</code> · registry:{' '}
        <code>lib/algorithms/capabilities/registry.ts</code> · runtime:{' '}
        <code>lib/algorithms/runtime.ts</code>
      </p>
    </div>
  )
}

function CatalogSection({
  id,
  title,
  description,
  entries,
  resultsById,
}: {
  id: string
  title: string
  description: string
  entries: readonly AlgorithmEntry[]
  resultsById: Map<string, AlgorithmRunResult>
}) {
  const top = entries.slice(0, 6)
  const rest = entries.slice(6)
  return (
    <>
      <div className="mb-4 border-b border-rule pb-3">
        <h2 id={id} className="font-display text-h2 text-ink">
          {title}
        </h2>
        <p className="mt-1 text-meta text-mute">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {top.map((algorithm) => {
          const result = resultsById.get(algorithm.id)
          return (
            <div key={algorithm.id} data-algorithm-id={algorithm.id}>
              <AdminCard className="h-full">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-caption font-bold text-brand-strong">
                    #{algorithm.number} · {algorithm.category}
                  </p>
                  <OpsCheckBadge status={result?.ok ? 'pass' : 'fail'} />
                </div>
                <h3 className="admin-section-title">{algorithm.label}</h3>
                <p className="mt-2 text-meta text-ink-soft">{algorithm.summary}</p>
                <WiringNote id={algorithm.id} />
              </AdminCard>
            </div>
          )
        })}
      </div>
      {rest.length ? (
        <details className="mt-4 border border-rule p-4">
          <summary className="cursor-pointer text-meta font-bold text-ink">
            बाँकी {rest.length} एन्ट्री
          </summary>
          <ul className="mt-3 grid gap-2 text-meta text-ink-soft md:grid-cols-2">
            {rest.map((algorithm) => (
              <li key={algorithm.id}>
                #{algorithm.number} {algorithm.label}
                {productWiringFor(algorithm.id)?.surface === 'newsroom' ? (
                  <span className="ml-1 text-caption text-mute">· newsroom-only</span>
                ) : null}
                {productWiringFor(algorithm.id)?.surface === 'platform' ? (
                  <span className="ml-1 text-caption text-mute">· platform</span>
                ) : null}
                {productWiringFor(algorithm.id) ? null : (
                  <span className="ml-1 text-caption text-mute">· panel-only</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </>
  )
}

/**
 * Says, per entry, who actually reaches this algorithm. Without it the pass
 * badge above reads as "shipped", which for most of the catalog it is not — and
 * the newsroom case has to be named separately, because calling the media
 * upload route "panel-only" would be the same lie in the other direction.
 */
function WiringNote({ id }: { id: string }) {
  const wiring = productWiringFor(id)
  if (!wiring) {
    return (
      <p className="mt-2 text-caption text-mute">
        Panel-only — no reader or newsroom surface imports it yet.
      </p>
    )
  }
  if (wiring.surface === 'newsroom') {
    return (
      <p className="mt-2 text-caption text-ink-soft">
        Newsroom-facing via <code>{wiring.entrypoint}</code> — no reader render calls it.
      </p>
    )
  }
  if (wiring.surface === 'platform') {
    return (
      <p className="mt-2 text-caption text-ink-soft">
        Ships as platform config in <code>{wiring.module}</code> — no module imports it.
      </p>
    )
  }
  return (
    <p className="mt-2 text-caption text-ink-soft">
      Reader-facing via <code>{wiring.entrypoint}</code>
    </p>
  )
}
