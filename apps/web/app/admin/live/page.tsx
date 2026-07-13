import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { getProviderHealth } from '@/lib/live/health'
import { getTrendingSamples } from '@/lib/engagement/store'
import { ACTIVE_ALGORITHM_REGISTRY, rankStories } from '@/lib/ranking'
import { AdminCard, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Live Admin Panel',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LiveAdminPage() {
  await requireNewsroomSession()
  const [{ items }, providers, samples] = await Promise.all([
    getStories({ locale: 'ne', perPage: 24 }),
    getProviderHealth(),
    getTrendingSamples(120),
  ])

  const now = Date.now()
  const perStory = new Map<string, { twoHour: number; tenMinute: number; comments: number }>()
  for (const sample of samples) {
    const current = perStory.get(sample.articleId) ?? { twoHour: 0, tenMinute: 0, comments: 0 }
    const weighted = sample.views + sample.shares * 6 + sample.comments * 3
    current.twoHour += weighted
    current.comments += sample.comments
    if (now - Date.parse(sample.at) <= 10 * 60_000) current.tenMinute += weighted
    perStory.set(sample.articleId, current)
  }

  const ranked = rankStories(items, (story) => {
    const activity = perStory.get(story.slug) ?? { twoHour: 0, tenMinute: 0, comments: 0 }
    return {
      editorialPriority: story.isBreaking ? 3 : 0,
      viewsPerHour: activity.twoHour / 2,
      viewsLast10Min: activity.tenMinute,
      baselineViewsPer10Min: Math.max(1, activity.twoHour / 12),
      commentsPerHour: activity.comments / 2,
      qualityTrustScore: 0.8,
    }
  }).slice(0, 8)

  const statusCounts = providers.reduce<Record<string, number>>((acc, provider) => {
    acc[provider.status] = (acc[provider.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <AdminPageHeader
        title="लाइभ सञ्चालन प्यानल"
        subtitle="सत्यापित reader activity, provider health र editorial ranking — काल्पनिक analytics होइन"
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Recent engagement events" value={String(samples.length)} />
        <Metric label="Stories with activity" value={String(perStory.size)} />
        <Metric label="Healthy feeds" value={String((statusCounts.ok ?? 0) + (statusCounts.success ?? 0))} />
        <Metric label="Needs configuration" value={String((statusCounts.unconfigured ?? 0) + (statusCounts.empty ?? 0))} />
      </section>

      <AdminCard className="mt-6 border-l-4 border-l-brand">
        <h2 className="font-display text-h2 text-ink">Instrumentation boundary</h2>
        <p className="mt-2 max-w-4xl text-meta leading-relaxed text-ink-soft">
          The table below uses persisted reading and approved-comment events. Impression/click experiments,
          credible intervals, unique live visitors and revenue LTV are not collected yet, so this panel does not
          manufacture those values. Their scoring functions remain available for a future consent-aware event pipeline.
        </p>
      </AdminCard>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <AdminCard>
          <h2 className="font-display text-h1 text-ink" lang="ne">सम्पादकीय + वास्तविक engagement ranking</h2>
          <p className="mt-1 text-meta text-ink-soft" lang="en">
            Scores combine publication recency, breaking priority, recent reads and approved comments. Zero activity remains zero.
          </p>
          <div className="mt-5 divide-y divide-rule">
            {ranked.map((story, index) => {
              const activity = perStory.get(story.slug) ?? { twoHour: 0, tenMinute: 0, comments: 0 }
              return (
                <article key={story.slug} className="grid gap-3 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
                  <span className="font-display text-h1 text-rule">{index + 1}</span>
                  <div>
                    <p className="font-display text-body-lg font-semibold text-ink" lang="ne">{story.titleNe}</p>
                    <p className="mt-1 text-caption text-mute">{story.category.nameNe} · score {story.rankScore.toFixed(1)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-caption">
                    <Signal label="2h events" value={String(activity.twoHour)} />
                    <Signal label="10 min" value={String(activity.tenMinute)} />
                    <Signal label="comments" value={String(activity.comments)} />
                  </div>
                </article>
              )
            })}
            {ranked.length === 0 ? <p className="py-6 text-meta text-mute">No published stories are available for ranking.</p> : null}
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
        <h2 className="font-display text-h1 text-ink" lang="ne">Algorithm library</h2>
        <p className="mt-1 text-meta text-ink-soft">Availability here means the pure scoring function exists; it does not imply every production signal is instrumented.</p>
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
