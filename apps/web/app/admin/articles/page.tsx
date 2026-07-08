import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canCreate, canEdit, canPublish } from '@/lib/admin-roles'
import { listArticlesForAdmin, type StoredArticle } from '@/lib/content/store/json-store'
import { categoryBySlug } from '@/lib/content/seed/categories'
import { AdminButton, AdminCard, AdminPageHeader } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'समाचार',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STAGE_LABELS: Record<StoredArticle['workflowStage'], string> = {
  idea: 'विचार',
  assigned: 'सौंपिएको',
  draft: 'ड्राफ्ट',
  submitted: 'पेश',
  fact_check: 'तथ्य-जाँच',
  copy_edit: 'कपी सम्पादन',
  seo_review: 'एसइओ समीक्षा',
  legal_review: 'कानुन समीक्षा',
  ready: 'तयार',
  scheduled: 'तालिका',
  published: 'प्रकाशित',
  archived: 'अभिलेख',
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  const sp = await searchParams
  const status = normalizeStatus(sp.status)
  const { items, total } = await listArticlesForAdmin({ status, limit: 80 })
  const payloadCanonical = process.env.PAYLOAD_CONTENT_SOURCE === 'payload'

  return (
    <div>
      <AdminPageHeader
        title="समाचार"
        subtitle={
          payloadCanonical
            ? 'Production content source Payload CMS हो। यो सूची JSON-store/dev fallback का सामग्रीका लागि मात्र हो।'
            : `JSON-store/dev content queue — कुल ${total} सामग्री`
        }
        action={
          canCreate(session.newsroomRole) ? (
            <AdminButton href="/admin/articles/new">नयाँ समाचार</AdminButton>
          ) : null
        }
      />

      {payloadCanonical ? (
        <AdminCard className="mb-5 border-brand/30 bg-brand-tint/40">
          <p className="text-body font-semibold text-ink" lang="ne">
            Canonical CMS: Payload
          </p>
          <p className="mt-1 text-meta text-ink-soft" lang="ne">
            लेख लेख्ने, मिडिया अपलोड गर्ने र प्रकाशन गर्ने मुख्य स्थान Payload admin हो। Web admin
            मा देखिने editor dev/ops fallback मात्र हो।
          </p>
          <a
            href={process.env.PAYLOAD_ADMIN_URL ?? 'http://localhost:3001/admin'}
            className="mt-3 inline-flex rounded-full bg-brand px-4 py-2 text-meta font-semibold text-surface"
          >
            Payload admin खोल्नुहोस्
          </a>
        </AdminCard>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink href="/admin/articles" active={!status}>
          सबै
        </FilterLink>
        {Object.entries(STAGE_LABELS).map(([key, label]) => (
          <FilterLink key={key} href={`/admin/articles?status=${key}`} active={status === key}>
            {label}
          </FilterLink>
        ))}
      </div>

      <AdminCard>
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-display text-h2 text-ink" lang="ne">
              समाचार छैन
            </p>
            <p className="mt-2 text-body text-ink-soft" lang="ne">
              {status
                ? `${STAGE_LABELS[status]} चरणमा सामग्री छैन।`
                : 'हालसम्म कुनै समाचार बनाइएको छैन।'}
            </p>
            {canCreate(session.newsroomRole) ? (
              <AdminButton href="/admin/articles/new" className="mt-5">
                पहिलो ड्राफ्ट बनाउनुहोस्
              </AdminButton>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-meta">
              <thead className="border-b border-rule text-caption uppercase tracking-wide text-mute">
                <tr>
                  <th className="py-2 pr-4">शीर्षक</th>
                  <th className="py-2 pr-4">विभाग</th>
                  <th className="py-2 pr-4">स्थिति</th>
                  <th className="py-2 pr-4">अपडेट</th>
                  <th className="py-2 text-right">कार्य</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {items.map((article) => {
                  const category = categoryBySlug.get(article.categorySlug)
                  const publicHref = `/${article.categorySlug}/${article.slug}`
                  return (
                    <tr key={article.id}>
                      <td className="max-w-xl py-3 pr-4">
                        <p className="font-semibold text-ink" lang="ne">
                          {article.titleNe}
                        </p>
                        <p className="mt-1 truncate text-caption text-mute" lang="en">
                          {article.slug}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-ink-soft" lang="ne">
                        {category?.nameNe ?? article.categorySlug}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full border border-rule px-2.5 py-1 text-caption font-semibold text-ink-soft"
                          lang="ne"
                        >
                          {STAGE_LABELS[article.workflowStage] ?? article.workflowStage}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-mute" lang="en">
                        {new Date(article.updatedAt).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {article.workflowStage === 'published' ? (
                            <Link
                              href={publicHref}
                              target="_blank"
                              className="rounded-full border border-rule px-3 py-1.5 text-caption font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
                            >
                              हेर्नुहोस्
                            </Link>
                          ) : null}
                          {canEdit(session.newsroomRole) || canPublish(session.newsroomRole) ? (
                            <Link
                              href={`/admin/articles/${article.id}/edit`}
                              className="rounded-full bg-brand px-3 py-1.5 text-caption font-semibold text-surface hover:bg-brand-strong"
                            >
                              सम्पादन
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  )
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'rounded-full bg-brand px-3 py-1.5 text-caption font-semibold text-surface'
          : 'rounded-full border border-rule px-3 py-1.5 text-caption font-semibold text-ink-soft hover:border-brand hover:text-brand-strong'
      }
    >
      {children}
    </Link>
  )
}

function normalizeStatus(value: string | undefined): StoredArticle['workflowStage'] | undefined {
  if (!value) return undefined
  return value in STAGE_LABELS ? (value as StoredArticle['workflowStage']) : undefined
}
