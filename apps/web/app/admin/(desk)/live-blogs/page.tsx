import Link from 'next/link'
import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit, canPublish } from '@/lib/admin-roles'
import {
  addLiveBlogUpdate,
  createLiveBlog,
  getLiveBlogBySlug,
  listLiveBlogs,
  setLiveBlogStatus,
  type LiveBlogStatus,
} from '@/lib/live-blog-admin'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminCard, AdminEmptyState, AdminPageHeader, AdminButton, AdminInput, AdminTextarea, AdminSelect, AdminCallout } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लाइभ ब्लग',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

async function createBlog(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole)) throw new Error('यो भूमिकालाई लाइभ ब्लग बनाउन अनुमति छैन।')
  const blog = await createLiveBlog({
    titleNe: formData.get('titleNe'),
    titleEn: formData.get('titleEn'),
    slug: formData.get('slug'),
    summaryNe: formData.get('summaryNe'),
    summaryEn: formData.get('summaryEn'),
    status: formData.get('status'),
    createdBy: session.email,
  })
  await recordAuditEvent({
    session,
    action: 'create',
    targetType: 'live_blog',
    targetId: blog.id,
    summary: `लाइभ ब्लग सिर्जना: ${blog.titleNe}`,
  })
  revalidatePath('/admin/live-blogs')
  revalidatePath(`/live/${blog.slug}`)
}

async function addUpdate(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole)) throw new Error('यो भूमिकालाई लाइभ अपडेट लेख्न अनुमति छैन।')
  const update = await addLiveBlogUpdate({
    liveBlogId: String(formData.get('liveBlogId') ?? ''),
    bodyNe: formData.get('bodyNe'),
    bodyEn: formData.get('bodyEn'),
    authorEmail: session.email,
    pinned: formData.get('pinned'),
  })
  const slug = String(formData.get('slug') ?? '')
  await recordAuditEvent({
    session,
    action: 'create',
    targetType: 'live_blog_update',
    targetId: update.id,
    summary: `लाइभ ब्लग अपडेट: ${slug}`,
  })
  revalidatePath('/admin/live-blogs')
  revalidatePath(`/live/${slug}`)
  revalidatePath(`/en/live/${slug}`)
}

async function changeStatus(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!canPublish(session.newsroomRole)) throw new Error('यो भूमिकालाई लाइभ स्थिति बदल्न अनुमति छैन।')
  const nextStatus = String(formData.get('status') ?? 'scheduled') as LiveBlogStatus
  if (!['scheduled', 'live', 'closed'].includes(nextStatus)) throw new Error('Invalid live-blog status')
  const blog = await setLiveBlogStatus(String(formData.get('id') ?? ''), nextStatus)
  if (!blog) throw new Error('Live blog not found')
  await recordAuditEvent({
    session,
    action: 'status_change',
    targetType: 'live_blog',
    targetId: blog.id,
    summary: `लाइभ ब्लग स्थिति: ${blog.status}`,
  })
  revalidatePath('/admin/live-blogs')
  revalidatePath(`/live/${blog.slug}`)
  revalidatePath(`/en/live/${blog.slug}`)
}

function formatDate(value?: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('ne-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kathmandu',
  }).format(new Date(value))
}

export default async function LiveBlogsPage() {
  const session = await requireNewsroomSession()
  const blogs = await listLiveBlogs()
  const records = await Promise.all(
    blogs.map(async (blog) => ({ blog, updates: (await getLiveBlogBySlug(blog.slug))?.updates ?? [] })),
  )
  const editable = canEdit(session.newsroomRole)
  const publishable = canPublish(session.newsroomRole)

  return (
    <div>
      <AdminPageHeader
        subtitle="ब्रेकिङ घटनाका लागि सत्यापित, समयक्रमबद्ध रोलिङ अपडेट"
      />

      {editable ? (
        <AdminCard className="mb-6">
          <h2 className="font-display text-h2 text-ink" lang="ne">नयाँ लाइभ ब्लग</h2>
          <form action={createBlog} className="mt-4 grid gap-4 lg:grid-cols-2">
            <AdminInput label="नेपाली शीर्षक *" name="titleNe" required lang="ne" />
            <AdminInput label="English title" name="titleEn" lang="en" />
            <div className="lg:col-span-2">
              <AdminInput label="Slug" name="slug" placeholder="auto-generated when blank" lang="en" />
            </div>
            <AdminTextarea label="नेपाली सारांश" name="summaryNe" rows={3} lang="ne" />
            <AdminTextarea label="English summary" name="summaryEn" rows={3} lang="en" />
            <div className="flex flex-wrap items-end gap-3 lg:col-span-2">
              <AdminSelect
                label="सुरुआती स्थिति"
                name="status"
                defaultValue="scheduled"
                lang="ne"
                options={[
                  { value: 'scheduled', label: 'तालिकाबद्ध' },
                  ...(publishable ? [{ value: 'live', label: 'तुरुन्त लाइभ' }] : []),
                ]}
              />
              <AdminButton type="submit">लाइभ ब्लग सिर्जना</AdminButton>
            </div>
          </form>
        </AdminCard>
      ) : (
        <AdminCallout tone="neutral" className="mb-6">
          <p className="text-body text-ink-soft" lang="ne">
            तपाईंको भूमिका हेर्न र अनुगमन गर्न मिल्छ; सिर्जना वा सम्पादनका लागि सम्पादकीय भूमिका आवश्यक छ।
          </p>
        </AdminCallout>
      )}

      {records.length === 0 ? (
        <AdminEmptyState
          title="कुनै लाइभ ब्लग छैन"
          body="ब्रेकिङ घटना, निर्वाचन, बजेट, विपद् वा खेलकुदको सत्यापित क्षण-क्षण विवरणका लागि मात्र लाइभ ब्लग खोल्नुहोस्।"
        />
      ) : (
        <div className="grid gap-5">
          {records.map(({ blog, updates }) => (
            <AdminCard key={blog.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`admin-status admin-status--${blog.status === 'live' ? 'danger' : blog.status === 'closed' ? 'neutral' : 'attention'}`}>
                      {blog.status === 'live' ? 'लाइभ' : blog.status === 'closed' ? 'समाप्त' : 'तालिकाबद्ध'}
                    </span>
                    <span className="text-caption text-mute">{updates.length} अपडेट</span>
                  </div>
                  <h2 className="mt-2 font-display text-h2 text-ink" lang="ne">{blog.titleNe}</h2>
                  {blog.titleEn ? <p className="mt-1 text-meta text-ink-soft" lang="en">{blog.titleEn}</p> : null}
                  {blog.summaryNe ? <p className="mt-3 max-w-3xl text-body text-ink-soft" lang="ne">{blog.summaryNe}</p> : null}
                  <p className="mt-3 text-caption text-mute" lang="ne">
                    अपडेट: {formatDate(blog.updatedAt)} · slug: <code>{blog.slug}</code>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.status !== 'scheduled' ? (
                    <Link href={`/live/${blog.slug}`} className="admin-button admin-button--secondary">
                      सार्वजनिक पृष्ठ ↗
                    </Link>
                  ) : null}
                  {publishable ? (
                    <form action={changeStatus} className="flex flex-wrap gap-2">
                      <input type="hidden" name="id" value={blog.id} />
                      {blog.status !== 'live' ? (
                        <button name="status" value="live" className="admin-button admin-button--primary">लाइभ खोल्नुहोस्</button>
                      ) : null}
                      {blog.status !== 'closed' ? (
                        <button name="status" value="closed" className="admin-button admin-button--secondary">समाप्त गर्नुहोस्</button>
                      ) : (
                        <button name="status" value="scheduled" className="admin-button admin-button--secondary">पुनः तालिकाबद्ध</button>
                      )}
                    </form>
                  ) : null}
                </div>
              </div>

              {editable && blog.status !== 'closed' ? (
                <details className="mt-5 border-t border-rule pt-4">
                  <summary className="cursor-pointer text-meta font-bold text-brand-strong" lang="ne">+ नयाँ अपडेट लेख्नुहोस्</summary>
                  <form action={addUpdate} className="mt-4 grid gap-3">
                    <input type="hidden" name="liveBlogId" value={blog.id} />
                    <input type="hidden" name="slug" value={blog.slug} />
                    <AdminTextarea label="नेपाली अपडेट *" name="bodyNe" required rows={5} lang="ne" />
                    <AdminTextarea label="English update" name="bodyEn" rows={4} lang="en" />
                    <label className="flex items-center gap-2 text-caption font-semibold text-ink-soft" lang="ne">
                      <input name="pinned" type="checkbox" className="size-4 accent-brand" /> मुख्य अपडेटका रूपमा पिन गर्नुहोस्
                    </label>
                    <AdminButton type="submit">अपडेट प्रकाशित गर्नुहोस्</AdminButton>
                  </form>
                </details>
              ) : null}

              {updates.length > 0 ? (
                <ol className="mt-5 divide-y divide-rule border-t border-rule">
                  {updates.slice(0, 5).map((update) => (
                    <li key={update.id} className="py-4">
                      <p className="text-caption font-semibold text-brand-strong">
                        {update.pinned ? 'पिन गरिएको · ' : ''}{formatDate(update.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-body text-ink" lang="ne">{update.bodyNe}</p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
