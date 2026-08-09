import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canCreate, canEdit, canPublish } from '@/lib/admin-roles'
import { listArticlesForAdmin, type StoredArticle } from '@/lib/content/store/json-store'
import { categoryBySlug } from '@/lib/content/seed/categories'
import { publicArticlePath } from '@/lib/content/article-visibility'
import { firstAdminLoadError, safeAdminLoad } from '@/lib/admin/safe-load'
import { AdminLoadErrorBanner, CmsCanonicalBanner } from '@/components/admin/CmsCanonicalBanner'
import {
  AdminButton,
  AdminCard,
  AdminCallout,
  AdminFilterLink,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
} from '@/components/admin/primitives'
import { getOpsHealthSnapshot } from '@/lib/ops/health-snapshot'
import { isPayloadCanonical, isPayloadSourceMisconfigured, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'

export const metadata: Metadata = {
  title: 'समाचार',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 40

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
  'idea',
  'assigned',
  'draft',
  'submitted',
  'fact_check',
  'copy_edit',
  'seo_review',
  'legal_review',
  'ready',
  'scheduled',
  'published',
  'updated',
  'archived',
  'retracted',
] as const

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  const session = await requireNewsroomSession()
  if (isPayloadSourceMisconfigured()) redirect('/admin/launch')
  if (isPayloadCanonical()) {
    redirect(payloadCollectionAdminUrl('articles'))
  }
  const sp = await searchParams
  const status = normalizeStatus(sp.status)
  const query = (sp.q ?? '').trim()
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const listResult = await safeAdminLoad(
    'articles-list',
    () =>
      listArticlesForAdmin({
        status,
        q: query || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    { items: [], total: 0 },
  )
  const loadError = firstAdminLoadError(listResult)
  const items = listResult.value.items
  const total = listResult.value.total
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const ops = await getOpsHealthSnapshot().catch(() => null)
  const scheduledCron = ops?.cron.find((job) => job.job === 'scheduled-publish')
  const cronSecretMissing =
    !process.env.CRON_SECRET?.trim() || (process.env.CRON_SECRET?.trim().length ?? 0) < 32
  const payloadMode = false
  const showScheduledCronWarning =
    !payloadMode &&
    (status === 'scheduled' || items.some((article) => article.workflowStage === 'scheduled')) &&
    Boolean(scheduledCron?.missed || cronSecretMissing)
  const showPayloadScheduleNote =
    payloadMode &&
    (status === 'scheduled' || items.some((article) => article.workflowStage === 'scheduled'))

  const listHref = (opts: { status?: string; q?: string; page?: number }) => {
    const params = new URLSearchParams()
    const nextStatus = opts.status ?? status
    const nextQ = opts.q ?? query
    const nextPage = opts.page ?? 1
    if (nextStatus) params.set('status', nextStatus)
    if (nextQ) params.set('q', nextQ)
    if (nextPage > 1) params.set('page', String(nextPage))
    const qs = params.toString()
    return qs ? `/admin/articles?${qs}` : '/admin/articles'
  }

  return (
    <div>
      <AdminPageHeader
        subtitle={
          loadError
            ? 'समाचार सूची लोड समस्या'
            : query
              ? `"${query}" — ${total} परिणाम`
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
      {showPayloadScheduleNote ? (
        <AdminCallout tone="attention" className="mb-4">
          <p className="text-meta font-semibold text-ink" lang="ne">
            Payload मोड: प्रकाशन Payload CMS बाट सञ्चालन हुन्छ।
          </p>
          <p className="mt-1 text-caption text-ink-soft" lang="ne">
            तालिकाबद्ध सामग्री अब cron बाट <span lang="en">published</span> मा सारिन्छ, तर डेस्क लेख
            सुरक्षित/सम्पादन यो सतहबाट होइन, Payload CMS बाट गर्नुहोस्।
          </p>
        </AdminCallout>
      ) : null}
      {showScheduledCronWarning ? (
        <AdminCallout tone="attention" className="mb-4">
          <p className="text-meta font-semibold text-ink" lang="ne">
            तालिकाबद्ध प्रकाशन चल्न सक्दैन: cron हराएको वा CRON_SECRET छैन।
          </p>
          <p className="mt-1 text-caption text-ink-soft" lang="ne">
            {cronSecretMissing
              ? 'GitHub Actions secrets मा CRON_SECRET (≥32 अक्षर) र वैकल्पिक CRON_BASE_URL सेट गर्नुहोस्।'
              : `scheduled-publish पछिल्लो रन: ${scheduledCron?.lastRunAt ?? 'कहिल्यै होइन'}।`}{' '}
            <Link href="/admin/launch" className="font-semibold text-brand-strong underline-offset-2 hover:underline">
              Launch जाँच
            </Link>
          </p>
        </AdminCallout>
      ) : null}

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
          <AdminButton href={listHref({ q: '', page: 1 })} variant="ghost">
            खाली
          </AdminButton>
        ) : null}
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <AdminFilterLink href={listHref({ status: '', page: 1 })} active={!status}>
          सबै
        </AdminFilterLink>
        {FILTER_STAGES.map((key) => (
          <AdminFilterLink
            key={key}
            href={listHref({ status: key, page: 1 })}
            active={status === key}
          >
            {STAGE_LABELS[key]}
          </AdminFilterLink>
        ))}
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
                  const publicHref = publicArticlePath(article.categorySlug, article.slug, 'ne')
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
            {totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rule px-1 py-3">
                <p className="text-caption text-mute" lang="ne">
                  पृष्ठ {safePage} / {totalPages} · {total} समाचार
                </p>
                <div className="flex gap-2">
                  {safePage > 1 ? (
                    <AdminButton
                      href={listHref({ page: safePage - 1 })}
                      variant="secondary"
                      className="!min-h-8 !px-2.5 !py-1 !text-caption"
                    >
                      अघिल्लो
                    </AdminButton>
                  ) : null}
                  {safePage < totalPages ? (
                    <AdminButton
                      href={listHref({ page: safePage + 1 })}
                      variant="secondary"
                      className="!min-h-8 !px-2.5 !py-1 !text-caption"
                    >
                      अर्को
                    </AdminButton>
                  ) : null}
                </div>
              </div>
            ) : null}
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
