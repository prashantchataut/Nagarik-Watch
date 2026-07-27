import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canCreate, canEdit, canPublish } from '@/lib/admin-roles'
import { listArticlesForAdmin, type StoredArticle } from '@/lib/content/store/json-store'
import { categoryBySlug } from '@/lib/content/seed/categories'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import {
  AdminButton,
  AdminCard,
  AdminFilterLink,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
} from '@/components/admin/primitives'

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
  updated: 'अद्यावधिक',
  archived: 'अभिलेख',
  retracted: 'फिर्ता लिइएको',
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('articles'))
  const sp = await searchParams
  const status = normalizeStatus(sp.status)
  const { items, total } = await listArticlesForAdmin({ status, limit: 80 })
  return (
    <div>
      <AdminPageHeader
        subtitle={`समाचार कक्षको सामग्री सूची — कुल ${total}`}
        action={
          canCreate(session.newsroomRole) ? (
            <AdminButton href="/admin/articles/new">नयाँ समाचार</AdminButton>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <AdminFilterLink href="/admin/articles" active={!status}>
          सबै
        </AdminFilterLink>
        {(['draft', 'submitted', 'ready', 'scheduled', 'published', 'updated', 'archived'] as const).map(
          (key) => (
            <AdminFilterLink key={key} href={`/admin/articles?status=${key}`} active={status === key}>
              {STAGE_LABELS[key]}
            </AdminFilterLink>
          ),
        )}
      </div>

      <AdminCard className={items.length > 0 ? 'overflow-hidden !p-0' : undefined}>
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="admin-section-title" lang="ne">
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
          <div className="px-4 py-1 sm:px-5">
            <AdminTable>
              <thead>
                <tr>
                  <th>शीर्षक</th>
                  <th>विभाग</th>
                  <th>स्थिति</th>
                  <th>अपडेट</th>
                  <th className="!text-right">कार्य</th>
                </tr>
              </thead>
              <tbody>
                {items.map((article) => {
                  const category = categoryBySlug.get(article.categorySlug)
                  const publicHref = `/${article.categorySlug}/${article.slug}`
                  return (
                    <tr key={article.id}>
                      <td className="max-w-xl">
                        <p className="font-semibold text-ink" lang="ne">
                          {article.titleNe}
                        </p>
                        <p className="mt-0.5 truncate text-caption text-mute" lang="en">
                          {article.slug}
                        </p>
                      </td>
                      <td className="text-ink-soft" lang="ne">
                        {category?.nameNe ?? article.categorySlug}
                      </td>
                      <td>
                        <StatusBadge status={article.workflowStage} />
                      </td>
                      <td className="text-mute" lang="en">
                        {new Date(article.updatedAt).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="!text-right">
                        <div className="flex justify-end gap-1.5">
                          {article.workflowStage === 'published' ? (
                            <AdminButton
                              href={publicHref}
                              variant="ghost"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="!min-h-8 !px-2.5 !py-1 !text-caption"
                            >
                              हेर्नुहोस्
                            </AdminButton>
                          ) : null}
                          {canEdit(session.newsroomRole) || canPublish(session.newsroomRole) ? (
                            <AdminButton
                              href={`/admin/articles/${article.id}/edit`}
                              className="!min-h-8 !px-2.5 !py-1 !text-caption"
                            >
                              सम्पादन
                            </AdminButton>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </AdminTable>
          </div>
        )}
      </AdminCard>
    </div>
  )
}

function normalizeStatus(value: string | undefined): StoredArticle['workflowStage'] | undefined {
  if (!value) return undefined
  return value in STAGE_LABELS ? (value as StoredArticle['workflowStage']) : undefined
}
