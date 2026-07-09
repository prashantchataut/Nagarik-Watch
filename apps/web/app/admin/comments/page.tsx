import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = { title: 'टिप्पणी', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function CommentsPage() {
  await requireNewsroomSession()
  return (
    <div>
      <AdminPageHeader title="टिप्पणी" subtitle="Moderation queue, spam checks and reader trust controls" />
      <AdminCard className="border-l-4 border-l-brand"><p className="text-body text-ink" lang="ne">Comment model जोडिएपछि pending, approved, rejected र spam queue यहाँ देखिन्छ। Client demo मा fake comments देखाइएको छैन।</p><div className="mt-5 rounded-lg border border-dashed border-rule p-8 text-center"><p className="font-display text-h2 text-ink">No comments waiting</p><p className="mt-2 text-meta text-mute">Wire the public comment submit endpoint to populate this moderation queue.</p></div></AdminCard>
    </div>
  )
}
