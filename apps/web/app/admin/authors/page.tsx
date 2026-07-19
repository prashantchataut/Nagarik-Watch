import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertLocalContentAdmin, isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { assertNewsroomRole, TAXONOMY_MANAGER_ROLES } from '@/lib/admin-roles'
import { archiveTaxonomyTerm, listTaxonomyTerms, upsertTaxonomyTerm } from '@/lib/taxonomy-admin'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminTable,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लेखक',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

function termStatusTone(status: string): 'success' | 'attention' | 'neutral' {
  if (status === 'active') return 'success'
  if (status === 'hidden') return 'attention'
  return 'neutral'
}

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
            <AdminInput label="नाम" name="nameNe" required />
            <AdminInput label="English name" name="nameEn" lang="en" />
            <AdminInput label="Slug" name="slug" placeholder="auto-generated if blank" lang="en" />
            <AdminInput label="Email" name="email" type="email" lang="en" />
            <AdminInput label="Role" name="role" placeholder="staff / columnist / contributor" lang="en" />
            <AdminTextarea label="Description Nepali" name="descriptionNe" rows={4} />
            <AdminTextarea label="Description English" name="descriptionEn" rows={3} lang="en" />
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminSelect
                label="Status"
                name="status"
                lang="en"
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'hidden', label: 'Hidden' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <AdminInput label="Sort order" name="sortOrder" type="number" defaultValue={100} lang="en" />
            </div>
            <AdminButton type="submit">Save लेखक</AdminButton>
          </form>
        </AdminCard>

        <AdminCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-h2 text-ink" lang="ne">सूची</h2>
            <p className="text-caption text-mute" lang="en">{active.length} active · {terms.length} total</p>
          </div>
          <div className="mt-4">
            <AdminTable>
              <thead>
                <tr><th>Name</th><th>Slug</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {terms.map((term) => (
                  <tr key={term.id} className="align-top">
                    <td><p className="font-semibold text-ink" lang="ne">{term.nameNe}</p><p className="text-caption text-mute" lang="en">{term.nameEn}</p></td>
                    <td className="font-mono text-caption text-ink-soft">{term.slug}</td>
                    <td>
                      <span className={`admin-status admin-status--${termStatusTone(term.status)}`}>{term.status}</span>
                    </td>
                    <td>
                      <form action={archiveTerm}>
                        <input type="hidden" name="slug" value={term.slug} />
                        <AdminButton type="submit" variant="ghost" className="!min-h-9 !px-2 !text-caption">
                          Archive
                        </AdminButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
