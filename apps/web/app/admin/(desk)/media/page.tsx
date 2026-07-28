import Image from 'next/image'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertLocalContentAdmin, isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { assertNewsroomRole, MEDIA_MANAGER_ROLES } from '@/lib/admin-roles'
import { createMediaItem, listMediaItems } from '@/lib/media-library'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard, AdminCallout, AdminButton, AdminInput, AdminTextarea } from '@/components/admin/primitives'
import { MediaUploadForm } from '@/components/admin/MediaUploadForm'

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
  const items = await listMediaItems({ limit: 72 })
  const persistentStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.S3_BUCKET || process.env.STORAGE_BUCKET)
  return (
    <div>
      <AdminPageHeader subtitle="Image library metadata and production storage readiness" />
      {!persistentStorage ? (
        <AdminCallout tone="attention" className="mb-5">
          <p className="text-meta text-ink-soft" lang="ne">
            Persistent media storage कन्फिगर छैन। Vercel मा local filesystem upload production-safe हुँदैन; Blob/S3/R2 जोड्नुहोस्।
          </p>
        </AdminCallout>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Add media</h2>
          <form action={saveMedia} className="mt-4 grid gap-3">
            <AdminInput label="Image URL" name="url" required lang="en" />
            <AdminInput label="Alt text" name="alt" required lang="en" />
            <AdminTextarea label="Caption" name="caption" rows={3} lang="en" />
            <AdminInput label="Credit" name="credit" lang="en" />
            <AdminButton type="submit">Save media URL</AdminButton>
          </form>
          {persistentStorage ? <MediaUploadForm /> : null}
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
