import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { AdminPageHeader, AdminCard, AdminEmptyState } from '@/components/admin/primitives'
import { JournalistFeedbackActions } from '@/components/admin/JournalistFeedbackActions'

export const metadata: Metadata = {
  title: 'पत्रकार',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <AdminCard><p className="text-caption text-mute">Reporter count</p><p className="font-display text-h1 text-ink">{byReporter.size}</p></AdminCard>
        <AdminCard><p className="text-caption text-mute">Draft handoffs</p><p className="font-display text-h1 text-ink">{drafts.length}</p></AdminCard>
        <AdminCard><p className="text-caption text-mute">Boundary</p><p className="mt-1 text-meta text-ink-soft">Journalists submit from /journalist, not /admin.</p></AdminCard>
      </div>

      <section className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        {drafts.length ? (
          <table className="min-w-full divide-y divide-rule text-left">
            <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
              <tr><th className="px-4 py-3">Article</th><th className="px-4 py-3">Reporter</th><th className="px-4 py-3">Evidence</th><th className="px-4 py-3">Distribution</th><th className="px-4 py-3">Editor feedback</th></tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {drafts.map((draft) => (
                <tr key={`${draft.articleSlug}-${draft.updatedAt}`} className="align-top hover:bg-brand-tint/30">
                  <td className="px-4 py-3"><strong className="block text-meta text-ink">{draft.titleNe}</strong><code className="mt-1 block font-mono text-caption text-ink-soft">{draft.articleSlug}</code><span className="mt-1 block text-caption text-mute">{draft.categorySlug} · {draft.workflowStage}</span></td>
                  <td className="px-4 py-3 text-meta text-ink-soft"><code>{draft.reporterId}</code></td>
                  <td className="max-w-xs px-4 py-3 text-meta text-ink-soft"><strong className="block text-ink">{draft.reportingLocation ?? 'स्थान नखुलेको'}</strong><span className="mt-1 block">{draft.sourceNote ?? draft.editorPitch ?? 'प्रमाण नोट छैन'}</span></td>
                  <td className="max-w-xs px-4 py-3 text-meta text-ink-soft"><span className="block">Alert: {draft.notificationMode}</span><span className="mt-1 block">{draft.notificationTags.join(', ') || 'ट्याग छैन'}</span></td>
                  <td className="min-w-[22rem] px-4 py-3"><JournalistFeedbackActions identifier={draft.articleId || draft.articleSlug} reporterId={draft.reporterId} initialFeedback={draft.editorFeedback} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <AdminEmptyState title="कुनै journalist handoff छैन" body="पत्रकारले /journalist/articles/new बाट draft save/submit गरेपछि यहाँ editor handoff देखिन्छ।" />
        )}
      </section>
    </div>
  )
}
