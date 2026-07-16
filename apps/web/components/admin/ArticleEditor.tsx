'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Category, Tag } from '@nagarikwatch/db'
import type { NewsroomRole } from '@/lib/admin-roles'
import { canPublish, canEdit } from '@/lib/admin-roles'
import { AdminInput, AdminTextarea, AdminSelect, AdminButton } from '@/components/admin/primitives'

type ArticleDraft = {
  slug: string
  titleNe: string
  titleEn: string
  deckNe: string
  deckEn: string
  bodyNe: string
  bodyEn: string
  category: string
  tagSlugs: string[]
  workflowStage: string
  sourceType: string
  sourceName: string
  sourceUrl: string
  isBreaking: boolean
  featuredState: string
  seoTitle: string
  seoDescription: string
  noIndex: boolean
  includeInNewsSitemap: boolean
  aiSummary: string
  premium: boolean
  commentsEnabled: boolean
  heroImageUrl: string
  heroCaption: string
  heroCredit: string
}

const EMPTY: ArticleDraft = {
  slug: '',
  titleNe: '',
  titleEn: '',
  deckNe: '',
  deckEn: '',
  bodyNe: '',
  bodyEn: '',
  category: '',
  tagSlugs: [],
  workflowStage: 'draft',
  sourceType: 'original',
  sourceName: '',
  sourceUrl: '',
  isBreaking: false,
  featuredState: 'none',
  seoTitle: '',
  seoDescription: '',
  noIndex: false,
  includeInNewsSitemap: false,
  aiSummary: '',
  premium: false,
  commentsEnabled: false,
  heroImageUrl: '',
  heroCaption: '',
  heroCredit: '',
}

const WORKFLOW_STAGES = [
  { value: 'idea', label: 'विचार' },
  { value: 'assigned', label: 'सौंपिएको' },
  { value: 'draft', label: 'ड्राफ्ट' },
  { value: 'submitted', label: 'पेश' },
  { value: 'fact_check', label: 'तथ्य-जाँच' },
  { value: 'copy_edit', label: 'कपी सम्पादन' },
  { value: 'seo_review', label: 'एसइओ समीक्षा' },
  { value: 'legal_review', label: 'कानुन समीक्षा' },
  { value: 'ready', label: 'प्रकाशन तयार' },
  { value: 'scheduled', label: 'तालिका' },
  { value: 'published', label: 'प्रकाशित' },
  { value: 'updated', label: 'अद्यावधिक' },
  { value: 'archived', label: 'अभिलेख' },
  { value: 'retracted', label: 'फिर्ता लिइएको' },
]

const SOURCE_TYPES = [
  { value: 'original', label: 'मौलिक' },
  { value: 'aggregated', label: 'संकलित' },
  { value: 'wire', label: 'वायर' },
]

/**
 * Article editor form. Handles both create and edit (the parent passes an
 * optional initial draft). The form is a controlled component — every field
 * updates local state, and the submit handler POSTs to /api/admin/articles.
 *
 * The body field accepts a markdown-ish shorthand that the API converts to
 * ArticleBlock[] (paragraphs separated by blank lines; lines starting with
 * ## become heading2; > become pullQuote; - become list items). This keeps
 * the editor fast and accessible without shipping a full WYSIWYG.
 *
 * Role gating: only publishers can move to the "published" stage; journalists
 * can save drafts and submit; editors can move through review stages.
 */
export function ArticleEditor({
  initial,
  categories,
  tags,
  role,
  isNew,
}: {
  initial?: Partial<ArticleDraft> & { id?: string }
  categories: Category[]
  tags: Tag[]
  role: NewsroomRole
  isNew: boolean
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [draft, setDraft] = useState<ArticleDraft>({ ...EMPTY, ...initial })
  const [selectedTags, setSelectedTags] = useState<string[]>(initial?.tagSlugs ?? [])
  const [status, setStatus] = useState<{
    kind: 'idle' | 'saving' | 'saved' | 'error'
    msg?: string
  }>({
    kind: 'idle',
  })
  const [pending, startTransition] = useTransition()

  // Auto-generate slug from Nepali title when creating.
  useEffect(() => {
    if (isNew && draft.titleNe && !draft.slug) {
      const slug = draft.titleNe
        .toLowerCase()
        .replace(/[^\u0900-\u097Fa-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 80)
      setDraft((d) => ({ ...d, slug }))
    }
  }, [isNew, draft.titleNe, draft.slug])

  const canPublishArticle = canPublish(role)
  const canEditArticle = canEdit(role)
  const canManageHomepage = canPublish(role) || role === 'admin' || role === 'super_admin' || role === 'seo_manager'

  function update<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleTag(slug: string) {
    setSelectedTags((t) => (t.includes(slug) ? t.filter((s) => s !== slug) : [...t, slug]))
  }

  function save(targetStage?: string) {
    setStatus({ kind: 'saving' })
    startTransition(() => {
      void (async () => {
        try {
          const formData = formRef.current ? new FormData(formRef.current) : null
          const read = (name: string, fallback = '') =>
            String(formData?.get(name) ?? fallback).trim()
          const workflowStage = targetStage ?? read('workflowStage', draft.workflowStage)
          const body = {
            slug: read('slug', draft.slug),
            categorySlug: read('category', draft.category),
            titleNe: read('titleNe', draft.titleNe),
            titleEn: read('titleEn', draft.titleEn) || undefined,
            deckNe: read('deckNe', draft.deckNe) || undefined,
            deckEn: read('deckEn', draft.deckEn) || undefined,
            workflowStage,
            bodyNe: draft.bodyNe,
            bodyEn: draft.bodyEn || undefined,
            authorIds: [],
            tagSlugs: selectedTags,
            sourceType: read('sourceType', draft.sourceType) as 'original' | 'aggregated' | 'wire',
            sourceName: read('sourceName', draft.sourceName) || undefined,
            sourceUrl: read('sourceUrl', draft.sourceUrl) || undefined,
            isBreaking: draft.isBreaking,
            isFeatured: read('featuredState', draft.featuredState) as 'lead' | 'secondary' | 'none',
            seoTitleNe: read('seoTitle', draft.seoTitle) || undefined,
            seoDescriptionNe: read('seoDescription', draft.seoDescription) || undefined,
            noIndex: workflowStage === 'published' ? false : draft.noIndex,
            includeInNewsSitemap: workflowStage === 'published',
            aiSummary: read('aiSummary', draft.aiSummary) || undefined,
            premium: draft.premium,
            commentsEnabled: draft.commentsEnabled,
            heroImageUrl: read('heroImageUrl', draft.heroImageUrl) || undefined,
            heroCaptionNe: read('heroCaption', draft.heroCaption) || undefined,
            heroCredit: read('heroCredit', draft.heroCredit) || undefined,
          }
          const url = initial?.id ? `/api/admin/articles/${initial.id}` : '/api/admin/articles'
          const res = await fetch(url, {
            method: initial?.id ? 'PUT' : 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err?.error ?? err?.message ?? 'सुरक्षित गर्न सकिएन')
          }
          const saved = await res.json().catch(() => ({}))
          setStatus({ kind: 'saved', msg: 'सुरक्षित भयो' })
          if (isNew && saved?.id) {
            router.push(`/admin/articles/${saved.id}/edit`)
          } else {
            router.refresh()
          }
        } catch (e) {
          setStatus({ kind: 'error', msg: e instanceof Error ? e.message : 'त्रुटि' })
        }
      })()
    })
  }

  const wordCount = draft.bodyNe.trim() ? draft.bodyNe.trim().split(/\s+/).length : 0
  const readingMinutes = Math.max(1, Math.round(wordCount / 200))

  return (
    <form
      ref={formRef}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
      onSubmit={(event) => event.preventDefault()}
    >
      {/* MAIN COLUMN — content */}
      <div className="space-y-5">
        {status.kind === 'error' && (
          <div
            role="alert"
            className="rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
          >
            {status.msg}
          </div>
        )}
        {status.kind === 'saved' && (
          <div
            role="status"
            className="rounded-md border border-up/30 bg-brand-tint/50 px-4 py-3 text-meta font-semibold text-brand-strong"
          >
            ✓ {status.msg}
          </div>
        )}

        <div className="rounded-lg border border-rule bg-surface-raised p-5 space-y-4">
          <AdminInput
            label="शीर्षक (नेपाली)"
            name="titleNe"
            value={draft.titleNe}
            onChange={(e) => update('titleNe', e.target.value)}
            required
            placeholder="समाचारको शीर्षक"
            lang="ne"
            hint="अधिकतम १२० अक्षर। खोज इन्जिन र पाठक दुवैले देख्ने मुख्य शीर्षक।"
          />
          <AdminInput
            label="शीर्षक (अंग्रेजी) — वैकल्पिक"
            name="titleEn"
            value={draft.titleEn}
            onChange={(e) => update('titleEn', e.target.value)}
            placeholder="English headline (author-reviewed translation)"
            lang="en"
          />
          <AdminTextarea
            label="डेक (नेपाली)"
            name="deckNe"
            value={draft.deckNe}
            onChange={(e) => update('deckNe', e.target.value)}
            rows={2}
            placeholder="एक–दुई वाक्यको सारांश, शीर्षक अन्तर्गत देखिने।"
            lang="ne"
          />
          <AdminTextarea
            label="डेक (अंग्रेजी) — वैकल्पिक"
            name="deckEn"
            value={draft.deckEn}
            onChange={(e) => update('deckEn', e.target.value)}
            rows={2}
            lang="en"
          />
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-meta font-semibold text-ink" lang="ne">
              समाचारको मूल भाग (नेपाली) <span className="text-brand">*</span>
            </label>
            <span className="text-caption text-mute" lang="ne">
              {wordCount} शब्द · ~{readingMinutes} मिनेट
            </span>
          </div>
          <textarea
            value={draft.bodyNe}
            onChange={(e) => update('bodyNe', e.target.value)}
            rows={20}
            lang="ne"
            placeholder={`पहिलो अनुच्छेद यहाँ लेख्नुहोस्।

## सह-शीर्षक (वैकल्पिक)
दोस्रो अनुच्छेद…

> उद्धरण बक्सका लागि यो लाइन यसरी लेख्नुहोस्।

- सूची वस्तु १
- सूची वस्तु २`}
            className="w-full rounded-md border border-rule bg-surface px-3.5 py-3 font-devanagari text-body-lg leading-relaxed text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          />
          <details className="text-caption text-ink-soft">
            <summary className="cursor-pointer font-semibold" lang="ne">
              शर्टकट (मार्कडाउन शैली)
            </summary>
            <ul className="mt-2 space-y-1 pl-4" lang="ne">
              <li>रिक्त लाइनले अनुच्छेद छुट्याउँछ</li>
              <li>
                <code>##</code> ले सह-शीर्षक
              </li>
              <li>
                <code>&gt;</code> ले उद्धरण बक्स
              </li>
              <li>
                <code>-</code> ले सूची वस्तु
              </li>
            </ul>
          </details>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-5 space-y-4">
          <label className="grid gap-1.5">
            <span className="text-meta font-semibold text-ink" lang="ne">
              समाचारको मूल भाग (अंग्रेजी) — वैकल्पिक
            </span>
            <textarea
              value={draft.bodyEn}
              onChange={(e) => update('bodyEn', e.target.value)}
              rows={12}
              lang="en"
              placeholder="Author-reviewed English translation. Leave empty if not yet translated."
              className="w-full rounded-md border border-rule bg-surface px-3.5 py-3 text-body-lg leading-relaxed text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
            />
          </label>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-5 space-y-4">
          <p className="text-meta font-semibold text-ink" lang="ne">
            ट्याग
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggleTag(t.slug)}
                className={
                  selectedTags.includes(t.slug)
                    ? 'rounded-full bg-brand px-3 py-1 text-caption font-semibold text-surface'
                    : 'rounded-full border border-rule px-3 py-1 text-caption font-medium text-ink-soft hover:border-brand hover:text-brand-strong'
                }
                lang="ne"
              >
                {t.nameNe}
              </button>
            ))}
            {tags.length === 0 && (
              <span className="text-caption text-mute" lang="ne">
                कुनै ट्याग छैन। पहिले ट्याग व्यवस्थापनमा बनाउनुहोस्।
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SIDEBAR — metadata */}
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            प्रकाशन
          </p>
          <AdminSelect
            label="कार्यप्रवाह"
            name="workflowStage"
            value={draft.workflowStage}
            onChange={(e) => update('workflowStage', e.target.value)}
            options={WORKFLOW_STAGES}
            required
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <AdminButton onClick={() => save('draft')} variant="secondary" disabled={pending}>
              ड्राफ्ट सुरक्षित
            </AdminButton>
            {canEditArticle && (
              <AdminButton onClick={() => save('submitted')} variant="secondary" disabled={pending}>
                पेश गर्नुहोस्
              </AdminButton>
            )}
            {canPublishArticle && (
              <AdminButton onClick={() => save('published')} disabled={pending}>
                प्रकाशित गर्नुहोस्
              </AdminButton>
            )}
          </div>
          {status.kind === 'saving' && (
            <p className="text-caption text-ink-soft" lang="ne">
              सुरक्षित हुँदै…
            </p>
          )}
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            वर्गीकरण
          </p>
          <AdminSelect
            label="विभाग"
            name="category"
            value={draft.category}
            onChange={(e) => update('category', e.target.value)}
            options={[
              { value: '', label: '— छान्नुहोस् —' },
              ...categories.map((c) => ({ value: c.slug, label: c.nameNe })),
            ]}
            required
          />
          <AdminInput
            label="स्लग"
            name="slug"
            value={draft.slug}
            onChange={(e) => update('slug', e.target.value)}
            required
            placeholder="url-मा-देखिने-नाम"
            lang="en"
            hint="URL मा देखिने नाम। अंग्रेजी अक्षर र ड्यास मात्र।"
          />
        </div>

        {canManageHomepage ? (
        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            विशेषता
          </p>
          <label className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={draft.isBreaking}
              onChange={(e) => update('isBreaking', e.target.checked)}
              className="h-4 w-4 rounded border-rule accent-brand"
            />
            <span lang="ne">ब्रेकिङ समाचार</span>
          </label>
          <AdminSelect
            label="प्रमुखता"
            name="featuredState"
            value={draft.featuredState}
            onChange={(e) => update('featuredState', e.target.value)}
            options={[
              { value: 'none', label: 'सामान्य' },
              { value: 'lead', label: 'मुख्य समाचार' },
              { value: 'secondary', label: 'दोस्रो पंक्ति' },
            ]}
          />
          <label className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={draft.premium}
              onChange={(e) => update('premium', e.target.checked)}
              className="h-4 w-4 rounded border-rule accent-brand"
            />
            <span lang="ne">प्रिमियम सामग्री</span>
          </label>
          <label className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={draft.commentsEnabled}
              onChange={(e) => update('commentsEnabled', e.target.checked)}
              className="h-4 w-4 rounded border-rule accent-brand"
            />
            <span lang="ne">टिप्पणी खुला</span>
          </label>
        </div>
        ) : (
        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-2">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            विशेषता
          </p>
          <p className="text-caption text-mute" lang="ne">
            ब्रेकिङ, प्रमुखता र प्रिमियम प्रकाशक/एडमिनले मात्र सेट गर्छन्।
          </p>
          <label className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={draft.commentsEnabled}
              onChange={(e) => update('commentsEnabled', e.target.checked)}
              className="h-4 w-4 rounded border-rule accent-brand"
            />
            <span lang="ne">टिप्पणी खुला</span>
          </label>
        </div>
        )}

        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            स्रोत
          </p>
          <AdminSelect
            label="स्रोत प्रकार"
            name="sourceType"
            value={draft.sourceType}
            onChange={(e) => update('sourceType', e.target.value)}
            options={SOURCE_TYPES}
            required
          />
          {draft.sourceType !== 'original' && (
            <>
              <AdminInput
                label="स्रोतको नाम"
                name="sourceName"
                value={draft.sourceName}
                onChange={(e) => update('sourceName', e.target.value)}
                lang="ne"
              />
              <AdminInput
                label="स्रोत URL"
                name="sourceUrl"
                type="url"
                value={draft.sourceUrl}
                onChange={(e) => update('sourceUrl', e.target.value)}
                lang="en"
              />
            </>
          )}
        </div>

        {canManageHomepage || role === 'seo_manager' ? (
        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            एसइओ
          </p>
          <AdminInput
            label="मेटा शीर्षक"
            name="seoTitle"
            value={draft.seoTitle}
            onChange={(e) => update('seoTitle', e.target.value)}
            lang="ne"
            hint="रिक्त भए शीर्षक प्रयोग हुन्छ। ६० अक्षरसम्म।"
          />
          <AdminTextarea
            label="मेटा विवरण"
            name="seoDescription"
            value={draft.seoDescription}
            onChange={(e) => update('seoDescription', e.target.value)}
            rows={2}
            lang="ne"
            hint="१६० अक्षरसम्म। खोज परिणाममा देखिने।"
          />
          <AdminTextarea
            label="AI सारांश (LLMO)"
            name="aiSummary"
            value={draft.aiSummary}
            onChange={(e) => update('aiSummary', e.target.value)}
            rows={3}
            lang="ne"
            hint="AI उत्तर इन्जिनले उद्धृत गर्न सक्ने संक्षिप्त सारांश।"
          />
          <label className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={draft.noIndex}
              onChange={(e) => update('noIndex', e.target.checked)}
              className="h-4 w-4 rounded border-rule accent-brand"
            />
            <span lang="ne">खोजबाट लुकाउने (noindex)</span>
          </label>
          <label className="flex items-center gap-2 text-meta text-ink">
            <input
              type="checkbox"
              checked={draft.includeInNewsSitemap}
              onChange={(e) => update('includeInNewsSitemap', e.target.checked)}
              className="h-4 w-4 rounded border-rule accent-brand"
            />
            <span lang="ne">समाचार साइटम्यापमा समावेश</span>
          </label>
        </div>
        ) : null}

        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="ne">
            फोटो
          </p>
          <AdminInput
            label="फोटो URL"
            name="heroImageUrl"
            type="url"
            value={draft.heroImageUrl}
            onChange={(e) => update('heroImageUrl', e.target.value)}
            lang="en"
            placeholder="https://…"
          />
          <AdminInput
            label="क्याप्सन"
            name="heroCaption"
            value={draft.heroCaption}
            onChange={(e) => update('heroCaption', e.target.value)}
            lang="ne"
          />
          <AdminInput
            label="श्रेय"
            name="heroCredit"
            value={draft.heroCredit}
            onChange={(e) => update('heroCredit', e.target.value)}
            lang="ne"
            hint="फोटोको स्रोत/फोटोग्राफर।"
          />
        </div>

        <div className="flex justify-between gap-2">
          <Link
            href="/admin/articles"
            className="inline-flex h-10 items-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            ← सूचीमा फर्कनुहोस्
          </Link>
        </div>
      </aside>
    </form>
  )
}
