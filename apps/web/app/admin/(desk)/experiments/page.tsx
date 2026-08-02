import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { listExperimentAnalyses } from '@/lib/experiments/store'
import { AdminCard, AdminEmptyState, AdminPageHeader, AdminTable } from '@/components/admin/primitives'

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
                  <p className="text-caption font-bold text-brand-strong">
                    {definition.id} · {definition.status}
                  </p>
                  <h2 className="mt-1 font-display text-h2 text-ink">{definition.label}</h2>
                  <p className="mt-1 text-meta text-ink-soft">
                    Metric: {definition.primaryMetric} · minimum{' '}
                    {definition.minimumExposuresPerVariant.toLocaleString()} exposures/variant ·
                    winner threshold {(definition.winnerProbability * 100).toFixed(1)}%
                  </p>
                </div>
                <span className="admin-status admin-status--neutral">
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

              <div className="mt-4">
                <AdminTable>
                  <thead>
                    <tr>
                      <th>Variant</th>
                      <th>Exposures</th>
                      <th>Conversions</th>
                      <th>Posterior rate</th>
                      <th>Probability best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.variants.map((variant) => (
                      <tr key={variant.variantId}>
                        <td className="font-semibold text-ink">
                          {definition.variants.find((item) => item.id === variant.variantId)?.label ??
                            variant.variantId}
                          {analysis.winner === variant.variantId ? (
                            <span className="ml-2 text-caption text-brand-strong">winner</span>
                          ) : null}
                        </td>
                        <td className="text-ink-soft">{variant.exposures}</td>
                        <td className="text-ink-soft">{variant.conversions}</td>
                        <td className="text-ink-soft">
                          {(variant.posteriorMean * 100).toFixed(2)}%
                        </td>
                        <td className="font-semibold text-ink">
                          {(variant.probabilityBest * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}

