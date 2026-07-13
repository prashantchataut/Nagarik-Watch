import Image from 'next/image'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertLocalContentAdmin, isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { assertNewsroomRole, MEDIA_MANAGER_ROLES } from '@/lib/admin-roles'
import { createMediaItem, listMediaItems } from '@/lib/media-library'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = { title: 'मिडिया', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

async function saveMedia(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEDIA_MANAGER_ROLES)
  assertLocalContentAdmin()
  const item = await createMediaItem({ url: formData.get('url'), alt: formData.get('alt'), caption: formData.get('caption'), credit: formData.get('credit') })
  if (item) await recordAuditEvent({ session, action: 'create', targetType: 'media', targetId: item.id, summary: `Media added: ${item.alt}` })
  revalidatePath('/admin/media')
}

export default async function MediaPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEDIA_MANAGER_ROLES)
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('media'))
  const items = await listMediaItems()
  const persistentStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.S3_BUCKET || process.env.STORAGE_BUCKET)
  return (
    <div>
      <AdminPageHeader title="मिडिया" subtitle="Image library metadata and production storage readiness" />
      {!persistentStorage ? <AdminCard className="mb-5 border-l-4 border-l-brand"><p className="text-meta text-ink-soft" lang="ne">Persistent media storage कन्फिगर छैन। Vercel मा local filesystem upload production-safe हुँदैन; Blob/S3/R2 जोड्नुहोस्।</p></AdminCard> : null}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Add media</h2>
          <form action={saveMedia} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Image URL<input name="url" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Alt text<input name="alt" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Caption<textarea name="caption" rows={3} className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Credit<input name="credit" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">Save media</button>
          </form>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Library</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => <figure key={item.id} className="overflow-hidden rounded-lg border border-rule bg-surface"><div className="relative aspect-video bg-surface-raised"><Image src={item.url} alt={item.alt} fill className="object-cover" unoptimized /></div><figcaption className="p-3"><p className="text-meta font-semibold text-ink">{item.alt}</p><p className="text-caption text-mute">{item.credit || 'No credit'}</p></figcaption></figure>)}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
