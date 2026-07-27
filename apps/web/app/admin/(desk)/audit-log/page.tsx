import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { listAuditEvents } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard, AdminEmptyState, AdminTable } from '@/components/admin/primitives'

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
      <AdminCard className="overflow-hidden !p-0">
        {events.length ? (
          <AdminTable>
            <thead>
              <tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Summary</th></tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="text-caption text-mute" lang="en">{new Date(event.createdAt).toLocaleString()}</td>
                  <td className="text-meta text-ink-soft" lang="en">{event.actorEmail}<br /><span className="text-caption text-mute">{event.actorRole}</span></td>
                  <td><span className="admin-status admin-status--neutral">{event.action}</span></td>
                  <td className="font-mono text-caption text-ink-soft">{event.targetType}:{event.targetId}</td>
                  <td className="text-meta text-ink">{event.summary}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : (
          <AdminEmptyState
            title="अहिलेसम्म अडिट घटना छैन"
            body="CRUD, moderation, ad, settings र role changes भएपछि यहाँ देखिन्छ।"
          />
        )}
      </AdminCard>
    </div>
  )
}
