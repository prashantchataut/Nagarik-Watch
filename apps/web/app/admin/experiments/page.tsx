import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { listExperimentAnalyses } from '@/lib/experiments/store'
import { AdminCard, AdminEmptyState, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Experiments',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ExperimentsPage() {
  await requireNewsroomSession()
  const experiments = await listExperimentAnalyses()

  return (
    <div>
      <AdminPageHeader
        subtitle="Deterministic assignment, anonymous deduplicated events, and Bayesian winner guardrails."
      />

      {experiments.length === 0 ? (
        <AdminEmptyState
          title="कुनै प्रयोग कन्फिगर गरिएको छैन"
          body="EXPERIMENTS_JSON मा कम्तीमा दुई variant सहित draft/active प्रयोग राख्नुहोस्। ट्राफिक नभएसम्म विजेता देखाइँदैन।"
        />
      ) : (
        <div className="space-y-5">
          {experiments.map(({ definition, analysis }) => (
            <AdminCard key={definition.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
                    {definition.id} · {definition.status}
                  </p>
                  <h2 className="mt-1 font-display text-h1 text-ink">{definition.label}</h2>
                  <p className="mt-1 text-meta text-ink-soft">
                    Metric: {definition.primaryMetric} · minimum{' '}
                    {definition.minimumExposuresPerVariant.toLocaleString()} exposures/variant ·
                    winner threshold {(definition.winnerProbability * 100).toFixed(1)}%
                  </p>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-caption font-bold text-ink-soft">
                  {analysis.decision}
                </span>
              </div>

              {analysis.sequential ? (
                <p className="mt-3 text-meta text-ink-soft">
                  Sequential z-test (frequentist, no alpha-spending correction): z=
                  {analysis.sequential.z.toFixed(3)} ·{' '}
                  {analysis.sequential.decisive
                    ? `directional lead: ${analysis.sequential.leadingVariantId}`
                    : 'not decisive yet'}
                </p>
              ) : null}

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-rule text-left">
                  <thead className="text-caption uppercase tracking-wide text-mute">
                    <tr>
                      <th className="py-2 pr-4">Variant</th>
                      <th className="px-4 py-2">Exposures</th>
                      <th className="px-4 py-2">Conversions</th>
                      <th className="px-4 py-2">Posterior rate</th>
                      <th className="px-4 py-2">Probability best</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {analysis.variants.map((variant) => (
                      <tr key={variant.variantId}>
                        <td className="py-3 pr-4 font-semibold text-ink">
                          {definition.variants.find((item) => item.id === variant.variantId)?.label ??
                            variant.variantId}
                          {analysis.winner === variant.variantId ? (
                            <span className="ml-2 text-caption text-brand-strong">winner</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{variant.exposures}</td>
                        <td className="px-4 py-3 text-ink-soft">{variant.conversions}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {(variant.posteriorMean * 100).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">
                          {(variant.probabilityBest * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}

