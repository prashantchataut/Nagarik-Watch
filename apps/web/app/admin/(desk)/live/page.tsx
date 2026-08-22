import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { getProviderHealth } from '@/lib/live/health'
import { ACTIVE_ALGORITHM_REGISTRY, rankStories } from '@/lib/ranking'
import { buildStoryEngagementIndex, signalsForStory } from '@/lib/ranking-signals'
import { AdminCard, AdminMetric, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Live Admin Panel',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function LiveAdminPage() {
  await requireNewsroomSession()
  const [{ items }, engagement] = await Promise.all([
    getStories({ locale: 'ne', perPage: 24 }),
    buildStoryEngagementIndex(120),
  ])

  const ranked = rankStories(items, (story, index) =>
    signalsForStory(story, engagement, index),
  ).slice(0, 8)

  // Provider health is optional and historically the slowest panel. Only hit the
  // cached path; empty array if the first fetch is still warming.
  const providers = (await Promise.race([
    getProviderHealth(),
    new Promise<Awaited<ReturnType<typeof getProviderHealth>>>((resolve) =>
      setTimeout(() => resolve([]), 800),
    ),
  ]).catch(() => [])) as Awaited<ReturnType<typeof getProviderHealth>>

  const statusCounts = providers.reduce<Record<string, number>>((acc, provider) => {
    acc[provider.status] = (acc[provider.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      <AdminPageHeader subtitle="सत्यापित reader activity, provider health र editorial ranking — काल्पनिक analytics होइन" />

      <section className="admin-metric-grid" aria-label="Live panel metrics">
        <AdminMetric label="Recent engagement events" value={String(engagement.sampleCount)} />
        <AdminMetric label="Stories with activity" value={String(engagement.storyCount)} />
        <AdminMetric
          label="Healthy feeds"
          value={String((statusCounts.ok ?? 0) + (statusCounts.success ?? 0))}
          tone="brand"
        />
        <AdminMetric
          label="Needs configuration"
          value={String((statusCounts.unconfigured ?? 0) + (statusCounts.empty ?? 0))}
        />
      </section>

      <AdminCard className="mt-6">
        <h2 className="font-display text-h2 text-ink">Live ranking signals</h2>
        <p className="mt-2 max-w-4xl text-meta leading-relaxed text-ink-soft">
          Uses first-party reading events, approved comments, and consent-gated
          impression/click/share events. Empty signals stay at zero — scores do not invent traffic.
        </p>
      </AdminCard>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">
            सम्पादकीय + वास्तविक engagement ranking
          </h2>
          <p className="mt-1 text-meta text-ink-soft" lang="en">
            Same weightedScore pipeline as public hubs and /admin/algorithms.
          </p>
          <div className="mt-5 divide-y divide-rule">
            {ranked.map((story, index) => {
              const activity = engagement.bySlug.get(story.slug)
              return (
                <article
                  key={story.slug}
                  className="grid gap-3 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-center"
                >
                  <span className="font-display text-h2 text-rule">{index + 1}</span>
                  <div>
                    <p className="font-display text-body-lg font-semibold text-ink" lang="ne">
                      {story.titleNe}
                    </p>
                    <p className="mt-1 text-caption text-mute">
                      {story.category.nameNe} · score {story.rankScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-caption">
                    <Signal
                      label="views/h"
                      value={String(Math.round(activity?.viewsPerHour ?? 0))}
                    />
                    <Signal
                      label="10 min"
                      value={String(Math.round(activity?.viewsLast10Min ?? 0))}
                    />
                    <Signal
                      label="dwell"
                      value={`${Math.round(activity?.dwellTimeSeconds ?? 0)}s`}
                    />
                    <Signal label="imps" value={String(activity?.impressions ?? 0)} />
                  </div>
                </article>
              )
            })}
            {ranked.length === 0 ? (
              <p className="py-6 text-meta text-mute">
                No published stories are available for ranking.
              </p>
            ) : null}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">
            Provider health
          </h2>
          <div className="mt-4 grid gap-3">
            {providers.map((provider) => (
              <div key={provider.key} className="rounded-sm border border-rule bg-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink" lang="en">
                    {provider.label}
                  </p>
                  <span
                    className={`admin-status admin-status--${provider.status === 'ok' ? 'success' : 'neutral'}`}
                  >
                    {provider.status}
                  </span>
                </div>
                <p className="mt-1 text-caption text-mute" lang="en">
                  {provider.source}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <AdminCard className="mt-6">
        <h2 className="font-display text-h2 text-ink" lang="ne">
          Algorithm library
        </h2>
        <p className="mt-1 text-meta text-ink-soft">
          Availability here means the pure scoring function exists; it does not imply every
          production signal is instrumented.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ACTIVE_ALGORITHM_REGISTRY.map((algorithm) => (
            <div key={algorithm.id} className="rounded-sm border border-rule bg-surface p-4">
              <p className="text-caption font-bold text-brand-strong">{algorithm.id}</p>
              <p className="mt-1 font-display text-body-lg font-semibold text-ink">
                {algorithm.label}
              </p>
              <p className="mt-1 text-caption text-mute">{algorithm.surface}</p>
            </div>
          ))}
        </div>
      </AdminCard>
    </div>
  )
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-sm bg-surface-raised px-2 py-1">
      <span className="block text-[0.68rem] font-bold text-mute">{label}</span>
      <strong className="text-ink">{value}</strong>
    </span>
  )
}
