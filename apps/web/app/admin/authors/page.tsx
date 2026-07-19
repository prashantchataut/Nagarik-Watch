import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertLocalContentAdmin, isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { assertNewsroomRole, TAXONOMY_MANAGER_ROLES } from '@/lib/admin-roles'
import { archiveTaxonomyTerm, listTaxonomyTerms, upsertTaxonomyTerm } from '@/lib/taxonomy-admin'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लेखक',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function saveTerm(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, TAXONOMY_MANAGER_ROLES)
  assertLocalContentAdmin()
  const term = await upsertTaxonomyTerm({
    kind: 'author',
    slug: formData.get('slug'),
    nameNe: formData.get('nameNe'),
    nameEn: formData.get('nameEn'),
    descriptionNe: formData.get('descriptionNe'),
    descriptionEn: formData.get('descriptionEn'),
    status: formData.get('status'),
    sortOrder: formData.get('sortOrder'),
    metadata: { email: String(formData.get('email') ?? ''), role: String(formData.get('role') ?? '') },
  })
  await recordAuditEvent({ session, action: 'update', targetType: 'author', targetId: term.slug, summary: `लेखक अद्यावधिक: ${term.nameNe}` })
  revalidatePath('/admin/authors')
}

async function archiveTerm(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, TAXONOMY_MANAGER_ROLES)
  assertLocalContentAdmin()
  const slug = String(formData.get('slug') ?? '')
  await archiveTaxonomyTerm('author', slug)
  await recordAuditEvent({ session, action: 'delete', targetType: 'author', targetId: slug, summary: `लेखक archived: ${slug}` })
  revalidatePath('/admin/authors')
}

export default async function Page() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, TAXONOMY_MANAGER_ROLES)
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('authors'))
  const terms = await listTaxonomyTerms('author')
  const active = terms.filter((term) => term.status !== 'archived')

  return (
    <div>
      <AdminPageHeader subtitle="Byline directory for staff, columnists and contributors" />
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">नयाँ / सम्पादन</h2>
          <form action={saveTerm} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">
              नाम
              <input name="nameNe" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
            </label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">
              English name
              <input name="nameEn" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
            </label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">
              Slug
              <input name="slug" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" placeholder="auto-generated if blank" />
            </label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Email<input name="email" type="email" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label><label className="grid gap-1 text-caption font-semibold text-ink-soft">Role<input name="role" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" placeholder="staff / columnist / contributor" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">
              Description Nepali
              <textarea name="descriptionNe" rows={4} className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" />
            </label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">
              Description English
              <textarea name="descriptionEn" rows={3} className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-caption font-semibold text-ink-soft">
                Status
                <select name="status" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink">
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="grid gap-1 text-caption font-semibold text-ink-soft">
                Sort order
                <input name="sortOrder" type="number" defaultValue="100" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
              </label>
            </div>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong" lang="ne">Save लेखक</button>
          </form>
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-h2 text-ink" lang="ne">सूची</h2>
            <p className="text-caption text-mute" lang="en">{active.length} active · {terms.length} total</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-rule">
            <table className="min-w-full divide-y divide-rule text-left">
              <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {terms.map((term) => (
                  <tr key={term.id} className="align-top">
                    <td className="px-4 py-3"><p className="font-display font-semibold text-ink" lang="ne">{term.nameNe}</p><p className="text-caption text-mute" lang="en">{term.nameEn}</p></td>
                    <td className="px-4 py-3 font-mono text-caption text-ink-soft">{term.slug}</td>
                    <td className="px-4 py-3"><span className="rounded-full border border-rule px-2 py-0.5 text-caption text-ink-soft">{term.status}</span></td>
                    <td className="px-4 py-3">
                      <form action={archiveTerm}>
                        <input type="hidden" name="slug" value={term.slug} />
                        <button className="text-caption font-semibold text-brand-strong hover:underline" lang="ne">Archive</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
