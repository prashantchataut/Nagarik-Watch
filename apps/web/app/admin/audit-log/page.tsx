import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { listAuditEvents } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'अडिट लग',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  await requireNewsroomSession()
  const events = await listAuditEvents(150)

  return (
    <div>
      <AdminPageHeader subtitle="Sensitive newsroom actions, moderation changes and admin updates" />
      <AdminCard>
        {events.length ? (
          <div className="overflow-hidden rounded-lg border border-rule">
            <table className="min-w-full divide-y divide-rule text-left">
              <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
                <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Summary</th></tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-4 py-3 text-caption text-mute" lang="en">{new Date(event.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-meta text-ink-soft" lang="en">{event.actorEmail}<br /><span className="text-caption text-mute">{event.actorRole}</span></td>
                    <td className="px-4 py-3"><span className="rounded-full bg-brand-tint px-2 py-0.5 text-caption font-semibold text-brand-strong">{event.action}</span></td>
                    <td className="px-4 py-3 font-mono text-caption text-ink-soft">{event.targetType}:{event.targetId}</td>
                    <td className="px-4 py-3 text-meta text-ink">{event.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-rule p-8 text-center">
            <p className="font-display text-h2 text-ink" lang="ne">अहिलेसम्म अडिट घटना छैन</p>
            <p className="mt-2 text-meta text-mute" lang="ne">CRUD, moderation, ad, settings र role changes भएपछि यहाँ देखिन्छ।</p>
          </div>
        )}
      </AdminCard>
    </div>
  )
}
