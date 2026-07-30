import type { Metadata } from 'next'
import Link from 'next/link'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canCreate, canEdit, canPublish } from '@/lib/admin-roles'
import { listArticlesForAdmin, type StoredArticle } from '@/lib/content/store/json-store'
import { categoryBySlug } from '@/lib/content/seed/categories'
import { firstAdminLoadError, safeAdminLoad } from '@/lib/admin/safe-load'
import { AdminLoadErrorBanner, CmsCanonicalBanner } from '@/components/admin/CmsCanonicalBanner'
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

const FILTER_STAGES = [
  'draft',
  'submitted',
  'ready',
  'scheduled',
  'published',
  'updated',
  'archived',
] as const

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const session = await requireNewsroomSession()
  const sp = await searchParams
  const status = normalizeStatus(sp.status)
  const query = (sp.q ?? '').trim().toLowerCase()

  const listResult = await safeAdminLoad(
    'articles-list',
    () => listArticlesForAdmin({ status, limit: 120 }),
    { items: [], total: 0 },
  )
  const loadError = firstAdminLoadError(listResult)
  let items = listResult.value.items
  const total = listResult.value.total

  if (query) {
    items = items.filter((article) => {
      const hay = `${article.titleNe} ${article.slug} ${article.categorySlug} ${article.deckNe ?? ''}`.toLowerCase()
      return hay.includes(query)
    })
  }

  return (
    <div>
      <AdminPageHeader
        subtitle={
          loadError
            ? 'समाचार सूची लोड समस्या'
            : query
              ? `"${query}" — ${items.length} परिणाम`
              : `समाचार कक्षको सामग्री सूची — कुल ${total}`
        }
        action={
          canCreate(session.newsroomRole) ? (
            <AdminButton href="/admin/articles/new">नयाँ समाचार</AdminButton>
          ) : null
        }
      />

      <CmsCanonicalBanner />
      <AdminLoadErrorBanner message={loadError} />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2" role="search">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="min-w-[12rem] flex-1">
          <span className="sr-only">खोज</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="शीर्षक, स्लग वा विभाग खोज्नुहोस्"
            lang="ne"
            className="admin-field-control w-full"
          />
        </label>
        <AdminButton type="submit" variant="secondary">
          खोज
        </AdminButton>
        {query ? (
          <AdminButton href={status ? `/admin/articles?status=${status}` : '/admin/articles'} variant="ghost">
            खाली
          </AdminButton>
        ) : null}
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <AdminFilterLink href={query ? `/admin/articles?q=${encodeURIComponent(query)}` : '/admin/articles'} active={!status}>
          सबै
        </AdminFilterLink>
        {FILTER_STAGES.map((key) => {
          const href = query
            ? `/admin/articles?status=${key}&q=${encodeURIComponent(query)}`
            : `/admin/articles?status=${key}`
          return (
            <AdminFilterLink key={key} href={href} active={status === key}>
              {STAGE_LABELS[key]}
            </AdminFilterLink>
          )
        })}
      </div>

      <AdminCard className={items.length > 0 ? 'overflow-hidden !p-0' : undefined}>
        {items.length === 0 ? (
          <div className="py-10 text-center">
            <p className="admin-section-title" lang="ne">
              {loadError ? 'सूची उपलब्ध छैन' : 'समाचार छैन'}
            </p>
            <p className="mt-2 text-body text-ink-soft" lang="ne">
              {loadError
                ? 'डाटाबेस जडान जाँच गर्नुहोस्। DATABASE_URL सेट भएपछि सूची फेरि देखिन्छ।'
                : status
                  ? `${STAGE_LABELS[status]} चरणमा सामग्री छैन।`
                  : query
                    ? 'खोजसँग मिल्ने समाचार भेटिएन।'
                    : 'हालसम्म कुनै समाचार बनाइएको छैन।'}
            </p>
            {canCreate(session.newsroomRole) && !loadError ? (
              <AdminButton href="/admin/articles/new" className="mt-5">
                पहिलो ड्राफ्ट बनाउनुहोस्
              </AdminButton>
            ) : null}
            {loadError ? (
              <AdminButton href="/admin/launch" variant="secondary" className="mt-5">
                Launch जाँच खोल्नुहोस्
              </AdminButton>
            ) : null}
          </div>
        ) : (
          <div className="px-4 py-1 sm:px-5">
            <AdminTable caption="समाचार सूची">
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
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="font-semibold text-ink hover:text-brand-strong"
                            lang="ne"
                          >
                            {article.titleNe}
                          </Link>
                          {article.isBreaking ? (
                            <span className="rounded border border-breaking/40 bg-brand-tint px-1.5 py-0.5 text-caption font-bold text-brand-strong">
                              ब्रेकिङ
                            </span>
                          ) : null}
                          {article.isFeatured === 'lead' || article.isFeatured === 'featured' ? (
                            <span className="rounded border border-rule bg-surface px-1.5 py-0.5 text-caption text-mute">
                              {article.isFeatured === 'lead' ? 'मुख्य' : 'विशेष'}
                            </span>
                          ) : null}
                        </div>
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
                          {article.workflowStage === 'published' || article.workflowStage === 'updated' ? (
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
