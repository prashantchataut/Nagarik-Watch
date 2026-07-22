import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { AdminPageHeader, AdminCard, AdminEmptyState, AdminMetric, AdminTable } from '@/components/admin/primitives'
import { JournalistFeedbackActions } from '@/components/admin/JournalistFeedbackActions'

export const metadata: Metadata = {
  title: 'पत्रकार',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

export default async function AdminJournalistsPage() {
  await requireNewsroomSession()
  const drafts = await listJournalistDraftMeta().catch(() => [])
  const byReporter = new Map<string, number>()
  for (const draft of drafts) byReporter.set(draft.reporterId, (byReporter.get(draft.reporterId) ?? 0) + 1)

  return (
    <div>
      <AdminPageHeader
        subtitle="Admin shell बाहिर रहेको /journalist workflow बाट आएका draft handoff notes"
      />
      <section className="admin-metric-grid mb-5" aria-label="Journalist handoff metrics">
        <AdminMetric value={byReporter.size} label="Reporter count" />
        <AdminMetric value={drafts.length} label="Draft handoffs" />
        <AdminCard className="!border-dashed">
          <p className="admin-metric__label">Boundary</p>
          <p className="mt-1 text-meta text-ink-soft">Journalists submit from /journalist, not /admin.</p>
        </AdminCard>
      </section>

      <AdminCard className="overflow-hidden !p-0">
        {drafts.length ? (
          <AdminTable minWidth="48rem">
            <thead>
              <tr><th>Article</th><th>Reporter</th><th>Evidence</th><th>Distribution</th><th>Editor feedback</th></tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr key={`${draft.articleSlug}-${draft.updatedAt}`} className="align-top">
                  <td><strong className="block text-meta text-ink">{draft.titleNe}</strong><code className="mt-1 block font-mono text-caption text-ink-soft">{draft.articleSlug}</code><span className="mt-1 block text-caption text-mute">{draft.categorySlug} · {draft.workflowStage}</span></td>
                  <td className="text-meta text-ink-soft"><code>{draft.reporterId}</code></td>
                  <td className="max-w-xs text-meta text-ink-soft"><strong className="block text-ink">{draft.reportingLocation ?? 'स्थान नखुलेको'}</strong><span className="mt-1 block">{draft.sourceNote ?? draft.editorPitch ?? 'प्रमाण नोट छैन'}</span></td>
                  <td className="max-w-xs text-meta text-ink-soft"><span className="block">Alert: {draft.notificationMode}</span><span className="mt-1 block">{draft.notificationTags.join(', ') || 'ट्याग छैन'}</span></td>
                  <td className="min-w-[22rem]"><JournalistFeedbackActions identifier={draft.articleId || draft.articleSlug} reporterId={draft.reporterId} initialFeedback={draft.editorFeedback} /></td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        ) : (
          <AdminEmptyState title="कुनै journalist handoff छैन" body="पत्रकारले /journalist/articles/new बाट draft save/submit गरेपछि यहाँ editor handoff देखिन्छ।" />
        )}
      </AdminCard>
    </div>
  )
}
