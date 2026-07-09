import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { ACTIVE_ALGORITHM_REGISTRY, ALGORITHM_ROADMAP } from '@/lib/ranking'
import { AdminCard, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Algorithms',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AlgorithmsPage() {
  await requireNewsroomSession()

  return (
    <div>
      <AdminPageHeader
        title="एल्गोरिदम र परीक्षण"
        subtitle="Bayesian ranking, trending, recommendation, Wilson, bandit र LTV scoring को operational map"
      />
      <section className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Active</p>
          <p className="mt-2 font-display text-display text-ink">{ACTIVE_ALGORITHM_REGISTRY.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Roadmap</p>
          <p className="mt-2 font-display text-display text-ink">{ALGORITHM_ROADMAP.length}</p>
        </AdminCard>
        <AdminCard>
          <p className="text-caption font-semibold uppercase tracking-wide text-mute">Status</p>
          <p className="mt-2 font-display text-h1 text-brand-strong">Wired</p>
        </AdminCard>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ACTIVE_ALGORITHM_REGISTRY.map((algorithm) => (
          <AdminCard key={algorithm.id}>
            <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">{algorithm.id}</p>
            <h2 className="mt-2 font-display text-h1 text-ink">{algorithm.label}</h2>
            <p className="mt-2 text-meta text-ink-soft">Surface: {algorithm.surface}</p>
          </AdminCard>
        ))}
      </section>
    </div>
  )
}
