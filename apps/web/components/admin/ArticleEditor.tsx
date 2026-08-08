'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@nagarikwatch/ui'
import type { Author, Category, Tag } from '@nagarikwatch/db'
import type { NewsroomRole } from '@/lib/admin-roles'
import { canPublish, canEdit, canDelete } from '@/lib/admin-roles'
import { AdminInput, AdminTextarea, AdminSelect, AdminButton } from '@/components/admin/primitives'
import {
  HeroMediaField,
  type HeroMediaLibraryItem,
} from '@/components/admin/HeroMediaField'
import { StoryBodyEditor } from '@/components/newsroom/StoryBodyEditor'
import type { EditorPreferences } from '@/lib/editor-preferences-types'
import { PROVINCES } from '@/lib/site'

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
  featuredExpiresAt: string
  publishedAt: string
  seoTitle: string
  seoDescription: string
  noIndex: boolean
  includeInNewsSitemap: boolean
  aiSummary: string
  premium: boolean
  commentsEnabled: boolean
  heroImageUrl: string
  heroImageAlt: string
  heroCaption: string
  heroCredit: string
  authorIds: string[]
  province: string
  expectedUpdatedAt?: string
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
  featuredExpiresAt: '',
  publishedAt: '',
  seoTitle: '',
  seoDescription: '',
  noIndex: false,
  includeInNewsSitemap: false,
  aiSummary: '',
  premium: false,
  commentsEnabled: true,
  heroImageUrl: '',
  heroImageAlt: '',
  heroCaption: '',
  heroCredit: '',
  authorIds: [],
  province: '',
  expectedUpdatedAt: '',
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

function mapSaveError(status: number, err: { error?: string; message?: string; cmsUrl?: string }): string {
  const base = err.error ?? err.message ?? 'सुरक्षित गर्न सकिएन'
  if (status === 503 && /BLOB|R2|storage|DATABASE_URL|Postgres/i.test(base)) {
    return `${base} — /admin/launch मा भण्डारण र DATABASE_URL जाँच गर्नुहोस्।`
  }
  if (status === 409 && err.cmsUrl) return `${base} ${err.cmsUrl}`
  if (status === 401) return 'सत्र सकियो। फेरि लगइन गर्नुहोस्।'
  if (status === 403) return base || 'यो कार्यका लागि अनुमति छैन।'
  return err.cmsUrl ? `${base} ${err.cmsUrl}` : base
}

/**
 * Writing-first newsroom editor: title / deck / body dominate; metadata lives
 * in a sticky sidebar with a persistent action bar.
 */
export function ArticleEditor({
  initial,
  categories,
  tags,
  authors = [],
  role,
  isNew,
  mediaLibrary = [],
}: {
  initial?: Partial<ArticleDraft> & { id?: string }
  categories: Category[]
  tags: Tag[]
  authors?: Author[]
  role: NewsroomRole
  isNew: boolean
  mediaLibrary?: HeroMediaLibraryItem[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const [draft, setDraft] = useState<ArticleDraft>({ ...EMPTY, ...initial })
  const [selectedTags, setSelectedTags] = useState<string[]>(initial?.tagSlugs ?? [])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>(initial?.authorIds ?? [])
  const [status, setStatus] = useState<{
    kind: 'idle' | 'saving' | 'saved' | 'error'
    msg?: string
  }>({ kind: 'idle' })
  const [pending, startTransition] = useTransition()
  const [editorPrefs, setEditorPrefs] = useState<Pick<
    EditorPreferences,
    'density' | 'showFormattingHints' | 'defaultCategorySlug'
  > | null>(null)
  const prefsApplied = useRef(false)

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

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/newsroom/editor-preferences', { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as { preferences?: EditorPreferences }
        if (cancelled || !data.preferences) return
        setEditorPrefs({
          density: data.preferences.density,
          showFormattingHints: data.preferences.showFormattingHints,
          defaultCategorySlug: data.preferences.defaultCategorySlug,
        })
        if (
          !prefsApplied.current &&
          isNew &&
          !initial?.category &&
          data.preferences.defaultCategorySlug &&
          categories.some((item) => item.slug === data.preferences!.defaultCategorySlug)
        ) {
          prefsApplied.current = true
          setDraft((current) => ({
            ...current,
            category: data.preferences!.defaultCategorySlug,
          }))
        }
      } catch {
        /* optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categories, initial?.category, isNew])

  const canPublishArticle = canPublish(role)
  const canEditArticle = canEdit(role)
  const canDeleteArticle = canDelete(role) && Boolean(initial?.id) && !isNew
  const canManageHomepage =
    canPublish(role) || role === 'admin' || role === 'super_admin' || role === 'seo_manager'

  function update<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function toggleTag(slug: string) {
    setSelectedTags((t) => (t.includes(slug) ? t.filter((s) => s !== slug) : [...t, slug]))
  }

  function toggleAuthor(id: string) {
    setSelectedAuthors((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    )
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
          const heroImageUrl = read('heroImageUrl', draft.heroImageUrl) || undefined
          const heroImageAlt = read('heroImageAlt', draft.heroImageAlt) || undefined
          const publishedAtRaw = read('publishedAt', draft.publishedAt)

          if (!read('titleNe', draft.titleNe) || !read('category', draft.category) || !draft.bodyNe.trim() || !read('slug', draft.slug)) {
            throw new Error('शीर्षक, विभाग, स्लग र मूल भाग अनिवार्य छन्।')
          }
          if (workflowStage === 'published' || workflowStage === 'updated') {
            if (selectedAuthors.length === 0) {
              throw new Error('प्रकाशन अघि कम्तीमा एक लेखक छान्नुहोस्।')
            }
            if (heroImageUrl && !heroImageAlt) {
              throw new Error('हीरो तस्बिरको alt पाठ अनिवार्य छ।')
            }
          }
          if (workflowStage === 'scheduled') {
            if (!publishedAtRaw) {
              throw new Error('तालिकाबद्ध प्रकाशनका लागि मिति/समय राख्नुहोस्।')
            }
            const parsed = Date.parse(publishedAtRaw)
            if (!Number.isFinite(parsed)) {
              throw new Error('तालिका मिति मान्य छैन।')
            }
            if (parsed <= Date.now()) {
              throw new Error('तालिका मिति भविष्यमा हुनुपर्छ।')
            }
          }

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
            authorIds: selectedAuthors,
            tagSlugs: selectedTags,
            province: read('province', draft.province) || undefined,
            sourceType: read('sourceType', draft.sourceType) as 'original' | 'aggregated' | 'wire',
            sourceName: read('sourceName', draft.sourceName) || undefined,
            sourceUrl: read('sourceUrl', draft.sourceUrl) || undefined,
            isBreaking: draft.isBreaking,
            isFeatured: read('featuredState', draft.featuredState) as
              | 'lead'
              | 'featured'
              | 'secondary'
              | 'none',
            featuredExpiresAt: (() => {
              const raw = read('featuredExpiresAt', draft.featuredExpiresAt)
              if (!raw) return undefined
              const parsed = Date.parse(raw)
              return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined
            })(),
            publishedAt:
              workflowStage === 'scheduled'
                ? new Date(publishedAtRaw).toISOString()
                : undefined,
            seoTitleNe: read('seoTitle', draft.seoTitle) || undefined,
            seoDescriptionNe: read('seoDescription', draft.seoDescription) || undefined,
            noIndex: workflowStage === 'published' || workflowStage === 'updated' ? false : draft.noIndex,
            includeInNewsSitemap: workflowStage === 'published' || workflowStage === 'updated',
            aiSummary: read('aiSummary', draft.aiSummary) || undefined,
            premium: draft.premium,
            commentsEnabled: draft.commentsEnabled,
            heroImageUrl,
            heroImageAlt,
            heroCaptionNe: read('heroCaption', draft.heroCaption) || undefined,
            heroCredit: read('heroCredit', draft.heroCredit) || undefined,
            expectedUpdatedAt: draft.expectedUpdatedAt || undefined,
          }
          const url = initial?.id ? `/api/admin/articles/${initial.id}` : '/api/admin/articles'
          const res = await fetch(url, {
            method: initial?.id ? 'PUT' : 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as {
              error?: string
              message?: string
              cmsUrl?: string
            }
            throw new Error(mapSaveError(res.status, err))
          }
          const saved = (await res.json().catch(() => ({}))) as {
            id?: string
            publicPath?: string
            visibility?: 'public' | 'draft'
            visibilityHint?: string
            workflowStage?: string
            updatedAt?: string
          }
          if (saved.workflowStage) {
            update('workflowStage', saved.workflowStage)
          } else {
            update('workflowStage', workflowStage)
          }
          if (saved.updatedAt) {
            update('expectedUpdatedAt', saved.updatedAt)
          }
          const hint =
            saved.visibilityHint ??
            (workflowStage === 'published' || workflowStage === 'updated'
              ? 'प्रकाशित भयो। ताजा समाचार र लेख URL मा जाँच गर्नुहोस्।'
              : workflowStage === 'scheduled'
                ? 'तालिकामा राखियो। cron चलेपछि सार्वजनिक हुन्छ।'
                : workflowStage === 'ready'
                  ? 'तयार अवस्थामा सुरक्षित भयो। प्रकाशकले प्रकाशित गर्न सक्छन्।'
                  : 'सुरक्षित भयो। सार्वजनिक साइटमा देखिन प्रकाशित गर्नुहोस्।')
          setStatus({
            kind: 'saved',
            msg: saved.publicPath ? `${hint} → ${saved.publicPath}` : hint,
          })
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

  function removeArticle() {
    if (!initial?.id || !canDeleteArticle) return
    if (!window.confirm('यो समाचार स्थायी रूपमा मेटिनेछ। निश्चित हुनुहुन्छ?')) return
    setStatus({ kind: 'saving' })
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/admin/articles/${initial.id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          if (!res.ok) {
            const err = (await res.json().catch(() => ({}))) as { error?: string }
            throw new Error(err.error ?? 'मेटाउन सकिएन।')
          }
          router.push('/admin/articles')
          router.refresh()
        } catch (e) {
          setStatus({ kind: 'error', msg: e instanceof Error ? e.message : 'त्रुटि' })
        }
      })()
    })
  }

  const wordCount = draft.bodyNe.trim() ? draft.bodyNe.trim().split(/\s+/).length : 0
  const readingMinutes = Math.max(1, Math.round(wordCount / 200))
  const stageLabel =
    WORKFLOW_STAGES.find((row) => row.value === draft.workflowStage)?.label ?? draft.workflowStage

  const actionBar = (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <AdminButton onClick={() => save()} variant="secondary" disabled={pending}>
          सुरक्षित गर्नुहोस्
        </AdminButton>
        {canEditArticle ? (
          <AdminButton onClick={() => save('submitted')} variant="secondary" disabled={pending}>
            पेश गर्नुहोस्
          </AdminButton>
        ) : null}
        {canEditArticle && !canPublishArticle ? (
          <AdminButton onClick={() => save('ready')} variant="secondary" disabled={pending}>
            तयार
          </AdminButton>
        ) : null}
        {canPublishArticle ? (
          <>
            <AdminButton onClick={() => save('ready')} variant="secondary" disabled={pending}>
              तयार
            </AdminButton>
            <AdminButton onClick={() => save('scheduled')} variant="secondary" disabled={pending}>
              तालिका
            </AdminButton>
            <AdminButton onClick={() => save('published')} disabled={pending}>
              प्रकाशित गर्नुहोस्
            </AdminButton>
          </>
        ) : (
          <span className="text-caption text-mute" lang="ne">
            प्रकाशन अनुमति छैन — सम्पादक/प्रकाशक आवश्यक
          </span>
        )}
        <span className="text-caption text-mute" lang="ne">
          {pending || status.kind === 'saving'
            ? 'सुरक्षित हुँदै…'
            : `${wordCount} शब्द · ~${readingMinutes} मिनेट · ${stageLabel}`}
        </span>
        {canDeleteArticle ? (
          <AdminButton
            onClick={removeArticle}
            variant="ghost"
            disabled={pending}
            className="!text-breaking ml-auto"
          >
            मेटाउनुहोस्
          </AdminButton>
        ) : null}
      </div>
      {canPublishArticle ? (
        <p className="mt-1 text-caption text-ink-soft" lang="ne">
          सुरक्षित = हालको अवस्था। प्रकाशित = सार्वजनिक। तालिका = भविष्यको मिति (दायाँ प्यानल)।
        </p>
      ) : null}
    </div>
  )

  return (
    <form
      ref={formRef}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem]"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="space-y-4">
        <div className="sticky top-0 z-20 -mx-1 border-b border-rule bg-surface/95 px-1 py-3 backdrop-blur-sm">
          {actionBar}
          {status.kind === 'error' ? (
            <div
              role="alert"
              className="mt-2 rounded-md border border-breaking/30 bg-brand-tint px-3 py-2 text-meta font-semibold text-brand-strong"
            >
              {status.msg}
            </div>
          ) : null}
          {status.kind === 'saved' ? (
            <div
              role="status"
              className="mt-2 rounded-md border border-up/30 bg-brand-tint/50 px-3 py-2 text-meta font-semibold text-brand-strong"
            >
              {status.msg}
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-lg border border-rule bg-surface-raised p-4 sm:p-5">
          <AdminInput
            label="शीर्षक (नेपाली)"
            name="titleNe"
            value={draft.titleNe}
            onChange={(e) => update('titleNe', e.target.value)}
            required
            placeholder="समाचारको शीर्षक"
            lang="ne"
          />
          <AdminTextarea
            label="डेक (नेपाली)"
            name="deckNe"
            value={draft.deckNe}
            onChange={(e) => update('deckNe', e.target.value)}
            rows={2}
            placeholder="एक–दुई वाक्यको सारांश"
            lang="ne"
          />
          <StoryBodyEditor
            locale="ne"
            id="article-body-ne"
            name="bodyNe"
            label="मूल भाग"
            value={draft.bodyNe}
            onChange={(next) => update('bodyNe', next)}
            rows={22}
            required
            density={editorPrefs?.density ?? 'comfortable'}
            showHints={editorPrefs?.showFormattingHints ?? true}
            wordCountLabel={`${wordCount} शब्द · ~${readingMinutes} मिनेट`}
            className="admin-story-body"
          />
          <details className="text-caption text-ink-soft">
            <summary className="cursor-pointer font-semibold" lang="ne">
              अंग्रेजी अनुवाद र लेखन सर्टकट
            </summary>
            <div className="mt-3 space-y-3">
              <AdminInput
                label="शीर्षक (अंग्रेजी)"
                name="titleEn"
                value={draft.titleEn}
                onChange={(e) => update('titleEn', e.target.value)}
                lang="en"
              />
              <AdminTextarea
                label="डेक (अंग्रेजी)"
                name="deckEn"
                value={draft.deckEn}
                onChange={(e) => update('deckEn', e.target.value)}
                rows={2}
                lang="en"
              />
              <StoryBodyEditor
                locale="en"
                id="article-body-en"
                name="bodyEn"
                label="Body (English)"
                value={draft.bodyEn}
                onChange={(next) => update('bodyEn', next)}
                rows={10}
                density={editorPrefs?.density ?? 'comfortable'}
                showHints={false}
                wordCountLabel={`${draft.bodyEn.trim() ? draft.bodyEn.trim().split(/\s+/).length : 0} words`}
                className="admin-story-body"
                placeholder="Author-reviewed English translation"
              />
              <ul className="space-y-1 pl-4" lang="ne">
                <li>रिक्त लाइन = अनुच्छेद</li>
                <li>
                  <code>##</code> = सह-शीर्षक
                </li>
                <li>
                  <code>&gt;</code> = उद्धरण
                </li>
                <li>
                  <code>-</code> = सूची
                </li>
                <li>
                  <code>**मोटो**</code> · <code>*तिर्खा*</code> · <code>==हाइलाइट==</code> ·{' '}
                  <code>[पाठ](url)</code>
                </li>
              </ul>
            </div>
          </details>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-4 space-y-3">
          <fieldset>
            <legend className="text-meta font-semibold text-ink" lang="ne">
              ट्याग र लेखक
            </legend>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="ट्याग">
              {tags.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => toggleTag(t.slug)}
                  aria-pressed={selectedTags.includes(t.slug)}
                  className={cn(
                    'admin-filter-link',
                    selectedTags.includes(t.slug) && 'admin-filter-link--active',
                  )}
                  lang="ne"
                >
                  {t.nameNe}
                </button>
              ))}
              {tags.length === 0 ? (
                <span className="text-caption text-mute" lang="ne">
                  ट्याग छैन
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="लेखक">
              {authors.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  onClick={() => toggleAuthor(author.id)}
                  aria-pressed={selectedAuthors.includes(author.id)}
                  className={cn(
                    'admin-filter-link',
                    selectedAuthors.includes(author.id) && 'admin-filter-link--active',
                  )}
                  lang="ne"
                >
                  {author.name}
                </button>
              ))}
              {authors.length === 0 ? (
                <span className="text-caption text-mute" lang="ne">
                  लेखक छैन
                </span>
              ) : null}
            </div>
          </fieldset>
        </div>

        <div className="border-t border-rule pt-3 lg:hidden">{actionBar}</div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-16 lg:self-start">
        <div className="rounded-lg border border-rule bg-surface-raised p-3 space-y-3">
          <p className="text-meta font-semibold text-ink" lang="ne">
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
          {canPublishArticle || draft.workflowStage === 'scheduled' ? (
            <AdminInput
              label="तालिका प्रकाशन समय"
              name="publishedAt"
              type="datetime-local"
              value={draft.publishedAt}
              onChange={(e) => update('publishedAt', e.target.value)}
              hint="तालिका बटन प्रयोग गर्दा अनिवार्य; ब्राउजरको स्थानीय समय"
            />
          ) : null}
          <div className="hidden lg:block">{actionBar}</div>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-3 space-y-3">
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
            lang="en"
          />
          <AdminSelect
            label="प्रदेश"
            name="province"
            value={draft.province}
            onChange={(e) => update('province', e.target.value)}
            options={[
              { value: '', label: '— छैन / राष्ट्रिय —' },
              ...PROVINCES.map((p) => ({ value: p.slug, label: p.nameNe })),
            ]}
          />
        </div>

        <HeroMediaField
          url={draft.heroImageUrl}
          alt={draft.heroImageAlt}
          caption={draft.heroCaption}
          credit={draft.heroCredit}
          library={mediaLibrary}
          onChange={(next) =>
            setDraft((d) => ({
              ...d,
              heroImageUrl: next.url ?? d.heroImageUrl,
              heroImageAlt: next.alt ?? d.heroImageAlt,
              heroCaption: next.caption ?? d.heroCaption,
              heroCredit: next.credit ?? d.heroCredit,
            }))
          }
        />

        {canManageHomepage ? (
          <div className="rounded-lg border border-rule bg-surface-raised p-3 space-y-3">
            <label className="flex items-center gap-2 text-meta text-ink">
              <input
                type="checkbox"
                checked={draft.isBreaking}
                onChange={(e) => update('isBreaking', e.target.checked)}
                className="h-4 w-4 rounded border-rule accent-brand"
              />
              <span lang="ne">ब्रेकिङ</span>
            </label>
            <AdminSelect
              label="प्रमुखता"
              name="featuredState"
              value={draft.featuredState}
              onChange={(e) => update('featuredState', e.target.value)}
              options={[
                { value: 'none', label: 'सामान्य' },
                { value: 'lead', label: 'मुख्य (हीरो)' },
                { value: 'featured', label: 'विशेष' },
                { value: 'secondary', label: 'दोस्रो पंक्ति' },
              ]}
            />
            {draft.featuredState !== 'none' ? (
              <AdminInput
                label="प्रमुखता समाप्ति"
                name="featuredExpiresAt"
                type="datetime-local"
                value={draft.featuredExpiresAt}
                onChange={(e) => update('featuredExpiresAt', e.target.value)}
              />
            ) : null}
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
          <div className="rounded-lg border border-rule bg-surface-raised p-3">
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

        <details className="rounded-lg border border-rule bg-surface-raised p-3">
          <summary className="cursor-pointer text-meta font-semibold text-ink" lang="ne">
            स्रोत र एसइओ
          </summary>
          <div className="mt-3 space-y-3">
            <AdminSelect
              label="स्रोत प्रकार"
              name="sourceType"
              value={draft.sourceType}
              onChange={(e) => update('sourceType', e.target.value)}
              options={SOURCE_TYPES}
              required
            />
            {draft.sourceType !== 'original' ? (
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
            ) : null}
            {canManageHomepage ? (
              <>
                <AdminInput
                  label="मेटा शीर्षक"
                  name="seoTitle"
                  value={draft.seoTitle}
                  onChange={(e) => update('seoTitle', e.target.value)}
                  lang="ne"
                />
                <AdminTextarea
                  label="मेटा विवरण"
                  name="seoDescription"
                  value={draft.seoDescription}
                  onChange={(e) => update('seoDescription', e.target.value)}
                  rows={2}
                  lang="ne"
                />
                <AdminTextarea
                  label="AI सारांश"
                  name="aiSummary"
                  value={draft.aiSummary}
                  onChange={(e) => update('aiSummary', e.target.value)}
                  rows={2}
                  lang="ne"
                />
                <label className="flex items-center gap-2 text-meta text-ink">
                  <input
                    type="checkbox"
                    checked={draft.noIndex}
                    onChange={(e) => update('noIndex', e.target.checked)}
                    className="h-4 w-4 rounded border-rule accent-brand"
                  />
                  <span lang="ne">noindex</span>
                </label>
                <label className="flex items-center gap-2 text-meta text-ink">
                  <input
                    type="checkbox"
                    checked={draft.includeInNewsSitemap}
                    onChange={(e) => update('includeInNewsSitemap', e.target.checked)}
                    className="h-4 w-4 rounded border-rule accent-brand"
                  />
                  <span lang="ne">समाचार साइटम्याप</span>
                </label>
                <label className="flex items-center gap-2 text-meta text-ink">
                  <input
                    type="checkbox"
                    checked={draft.premium}
                    onChange={(e) => update('premium', e.target.checked)}
                    className="h-4 w-4 rounded border-rule accent-brand"
                  />
                  <span lang="ne">प्रिमियम</span>
                </label>
              </>
            ) : null}
          </div>
        </details>

        <AdminButton href="/admin/articles" variant="ghost">
          <span lang="ne">← सूचीमा फर्कनुहोस्</span>
        </AdminButton>
      </aside>
    </form>
  )
}
