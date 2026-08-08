'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sourceReliabilityFlags, type Category, type Locale, type Tag } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { StoryBodyEditor } from '@/components/newsroom/StoryBodyEditor'
import { MediaGalleryPicker, type GalleryMediaItem } from '@/components/newsroom/MediaGalleryPicker'
import { RichInlineText } from '@/components/article/RichInlineText'
import type { EditorPreferences } from '@/lib/editor-preferences-types'

type DraftValues = {
  titleNe: string
  titleEn: string
  slug: string
  categorySlug: string
  deckNe: string
  bodyNe: string
  tagSlugs: string[]
  heroImageUrl: string
  reportingLocation: string
  sourceNote: string
  editorPitch: string
  customHomepageText: string
  customSocialText: string
  notificationMode: 'none' | 'breaking' | 'followers'
  notificationTags: string[]
  workflowStage: string
  province: string
  district: string
  exclusive: boolean
  editorPick: boolean
}

type Props = {
  locale: Locale
  categories: Category[]
  tags: Tag[]
  mode?: 'create' | 'edit'
  articleId?: string
  initial?: Partial<DraftValues>
  revisions?: Array<{
    id: string
    actorRole: string
    action: 'saved' | 'submitted' | 'returned'
    stage: string
    createdAt: string
    contentHash: string
    titleNe: string
    bodyNe?: string
    deckNe?: string
    similarityToPrevious?: number
  }>
}

const empty: DraftValues = {
  titleNe: '', titleEn: '', slug: '', categorySlug: '', deckNe: '', bodyNe: '', tagSlugs: [],
  heroImageUrl: '', reportingLocation: '', sourceNote: '', editorPitch: '', customHomepageText: '',
  customSocialText: '', notificationMode: 'none', notificationTags: [], workflowStage: 'draft',
  province: '', district: '', exclusive: false, editorPick: false,
}

const EDITOR_TABS = ['story', 'evidence', 'distribution', 'preview'] as const
type EditorTab = (typeof EDITOR_TABS)[number]
type AssistanceAction = 'summary' | 'headlines' | 'tags' | 'factCheck'
type FactCheckData = {
  claims: Array<{
    claim: string
    claimant: string
    evidence: string
    sources: Array<{ url: string; label: string }>
    verdict: string
  }>
}
type Assistance = {
  action: AssistanceAction
  data: string | string[] | FactCheckData
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function JournalistArticleDraftForm({ locale, categories, tags, mode = 'create', articleId, initial, revisions = [] }: Props) {
  const ne = locale === 'ne'
  const router = useRouter()
  const [draft, setDraft] = useState<DraftValues>({ ...empty, categorySlug: categories[0]?.slug ?? '', ...initial })
  const [tab, setTab] = useState<EditorTab>('story')
  const [status, setStatus] = useState<{ type: 'ok' | 'error' | 'saving'; message: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [assistance, setAssistance] = useState<Assistance | null>(null)
  const [assistanceBusy, setAssistanceBusy] = useState<AssistanceAction | null>(null)
  const [pending, startTransition] = useTransition()
  const [editorPrefs, setEditorPrefs] = useState<Pick<EditorPreferences, 'autosaveSeconds' | 'density' | 'showFormattingHints'> | null>(null)
  const [heroGalleryOpen, setHeroGalleryOpen] = useState(false)
  const saveRef = useRef<(stage: 'draft' | 'submitted', silent?: boolean) => void>(() => undefined)
  const prefsApplied = useRef(false)

  const wordCount = useMemo(() => words(draft.bodyNe), [draft.bodyNe])
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180))
  const evidenceReady = Boolean(draft.reportingLocation && draft.sourceNote.trim().length >= 20)
  const storyReady = Boolean(draft.titleNe && draft.categorySlug && wordCount >= 40)
  const selectedTagSet = new Set(draft.tagSlugs)
  const selectedNotificationTagSet = new Set(draft.notificationTags)
  const selectedTags = draft.tagSlugs.map((slug) => tags.find((tag) => tag.slug === slug)).filter((tag): tag is Tag => Boolean(tag))
  const alertAudienceTags = (draft.notificationTags.length ? draft.notificationTags : draft.tagSlugs)
    .map((slug) => tags.find((tag) => tag.slug === slug))
    .filter((tag): tag is Tag => Boolean(tag))
  const sourceChecks = useMemo(() => {
    const urls = [
      ...(draft.sourceNote.match(/https?:\/\/[^\s)>\]]+/gi) ?? []),
      ...(draft.heroImageUrl ? [draft.heroImageUrl] : []),
    ]
    return [...new Set(urls)].map((url) => ({
      url,
      flags: sourceReliabilityFlags({ url, label: url }),
    }))
  }, [draft.heroImageUrl, draft.sourceNote])
  const localRecoveryKey = `nw-journalist-working-copy:${locale}:${articleId ?? 'new'}`

  function patch<K extends keyof DraftValues>(key: K, value: DraftValues[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value }
      if (key === 'titleNe' && mode === 'create' && !current.slug) next.slug = slugify(String(value))
      return next
    })
    setDirty(true)
  }

  function submit(stage: 'draft' | 'submitted', silent = false) {
    if (!draft.titleNe || !draft.categorySlug || !draft.bodyNe.trim() || !draft.slug) {
      setStatus({ type: 'error', message: ne ? 'शीर्षक, URL, विभाग र सामग्री आवश्यक छन्।' : 'Title, URL, category and body are required.' })
      setTab('story')
      return
    }
    if (stage === 'submitted' && !evidenceReady) {
      setStatus({ type: 'error', message: ne ? 'समीक्षामा पठाउन रिपोर्टिङ स्थान र स्रोत/प्रमाण नोट पूरा गर्नुहोस्।' : 'Add a reporting location and source/evidence note before submitting.' })
      setTab('evidence')
      return
    }
    if (stage === 'submitted' && draft.tagSlugs.length === 0) {
      setStatus({ type: 'error', message: ne ? 'समीक्षामा पठाउन कम्तीमा एउटा विषय ट्याग छान्नुहोस्।' : 'Select at least one topic tag before submitting.' })
      setTab('distribution')
      return
    }
    if (!silent) setStatus({ type: 'saving', message: stage === 'submitted' ? (ne ? 'समीक्षामा पठाइँदै…' : 'Submitting for review…') : (ne ? 'ड्राफ्ट सुरक्षित हुँदै…' : 'Saving draft…') })
    startTransition(async () => {
      try {
        const url = mode === 'edit' && articleId ? `/api/journalist/articles/${encodeURIComponent(articleId)}` : '/api/journalist/articles'
        const response = await fetch(url, {
          method: mode === 'edit' ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...draft, workflowStage: stage, locale }),
        })
        const body = await response.json().catch(() => ({})) as { error?: string; article?: { id?: string }; meta?: { articleId?: string } }
        if (!response.ok) throw new Error(body.error || 'Could not save the draft.')
        setDirty(false)
        setLastSavedAt(new Date().toISOString())
        setStatus({ type: 'ok', message: stage === 'submitted' ? (ne ? 'समाचार समीक्षामा पठाइयो।' : 'Story submitted for review.') : (ne ? 'ड्राफ्ट सुरक्षित भयो।' : 'Draft saved.') })
        if (mode === 'create') {
          try { sessionStorage.removeItem(localRecoveryKey) } catch {}
          const nextId = body.meta?.articleId || body.article?.id
          if (nextId) router.replace(localizeHref(locale, `/journalist/articles/${nextId}/edit`))
        }
        if (mode === 'edit' && !silent && stage === 'draft') router.refresh()
        if (stage === 'submitted') router.push(localizeHref(locale, '/journalist/assignments'))
      } catch (error) {
        const message = error instanceof Error ? error.message : (ne ? 'सुरक्षित गर्न सकिएन।' : 'Could not save.')
        setStatus({
          type: 'error',
          message: silent
            ? (ne ? `स्वतः सुरक्षित गर्न सकिएन: ${message}` : `Autosave failed: ${message}`)
            : message,
        })
      }
    })
  }
  saveRef.current = submit

  async function requestAssistance(action: AssistanceAction) {
    if (!draft.bodyNe.trim()) {
      setStatus({ type: 'error', message: ne ? 'सुझावका लागि पहिले समाचार सामग्री लेख्नुहोस्।' : 'Write some story body before requesting suggestions.' })
      return
    }
    setAssistanceBusy(action)
    setAssistance(null)
    try {
      const response = await fetch('/api/journalist/ai', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, body: draft.bodyNe, title: draft.titleNe }),
      })
      const result = await response.json().catch(() => ({})) as {
        error?: string
        suggestion?: { data?: Assistance['data']; needsEditorApproval?: boolean }
      }
      if (!response.ok || !result.suggestion || result.suggestion.needsEditorApproval !== true) {
        throw new Error(result.error || 'Could not generate suggestions.')
      }
      setAssistance({ action, data: result.suggestion.data ?? [] })
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Could not generate suggestions.' })
    } finally {
      setAssistanceBusy(null)
    }
  }

  function acceptAssistance(value?: string) {
    if (!assistance) return
    if (assistance.action === 'summary' && typeof assistance.data === 'string') {
      patch('deckNe', assistance.data)
    } else if (assistance.action === 'headlines' && value) {
      patch('titleNe', value)
    } else if (assistance.action === 'tags' && Array.isArray(assistance.data)) {
      const suggested = new Set(assistance.data.map((item) => slugify(item)))
      const matched = tags
        .filter((tag) => suggested.has(tag.slug) || suggested.has(slugify(tag.nameNe)) || Boolean(tag.nameEn && suggested.has(slugify(tag.nameEn))))
        .map((tag) => tag.slug)
      patch('tagSlugs', [...new Set([...draft.tagSlugs, ...matched])])
      if (matched.length === 0) {
        setStatus({ type: 'error', message: ne ? 'सुझावसँग मिल्ने newsroom ट्याग भेटिएन।' : 'No suggested terms matched the newsroom tag list.' })
        return
      }
    } else if (assistance.action === 'factCheck' && !Array.isArray(assistance.data) && typeof assistance.data !== 'string') {
      const checklist = assistance.data.claims
        .map((claim, index) => `${index + 1}. Claim: ${claim.claim}\nClaimant:\nEvidence:\nSources:\nVerdict:`)
        .join('\n\n')
      patch('sourceNote', [draft.sourceNote.trim(), 'Fact-check checklist (editor review required):', checklist].filter(Boolean).join('\n\n'))
      setTab('evidence')
    }
    setAssistance(null)
  }

  useEffect(() => {
    if (mode !== 'create' || initial) return
    try {
      const recovered = sessionStorage.getItem(localRecoveryKey)
      if (!recovered) return
      const parsed = JSON.parse(recovered) as Partial<DraftValues>
      if (!parsed.titleNe && !parsed.bodyNe) return
      setDraft((current) => ({ ...current, ...parsed }))
      setDirty(true)
      setStatus({ type: 'ok', message: ne ? 'यस ट्याबको सुरक्षित कार्य प्रति पुनः खोलियो।' : 'Recovered the working copy from this tab.' })
    } catch {}
  }, [initial, localRecoveryKey, mode, ne])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/newsroom/editor-preferences', { credentials: 'include' })
        if (!res.ok) return
        const data = (await res.json()) as { preferences?: EditorPreferences }
        if (cancelled || !data.preferences) return
        setEditorPrefs({
          autosaveSeconds: data.preferences.autosaveSeconds,
          density: data.preferences.density,
          showFormattingHints: data.preferences.showFormattingHints,
        })
        if (
          !prefsApplied.current &&
          mode === 'create' &&
          !initial?.categorySlug &&
          data.preferences.defaultCategorySlug &&
          categories.some((item) => item.slug === data.preferences!.defaultCategorySlug)
        ) {
          prefsApplied.current = true
          setDraft((current) => ({
            ...current,
            categorySlug: data.preferences!.defaultCategorySlug,
          }))
        }
      } catch {
        /* prefs optional */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [categories, initial?.categorySlug, mode])

  useEffect(() => {
    if (mode !== 'create' || !dirty) return
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem(localRecoveryKey, JSON.stringify(draft)) } catch {}
    }, 800)
    return () => window.clearTimeout(timer)
  }, [dirty, draft, localRecoveryKey, mode])

  useEffect(() => {
    if (mode !== 'edit') return
    const intervalMs = Math.max(10, editorPrefs?.autosaveSeconds ?? 30) * 1000
    const timer = window.setInterval(() => {
      if (dirty && !pending) saveRef.current('draft', true)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [dirty, editorPrefs?.autosaveSeconds, mode, pending])

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  const labels = {
    story: ne ? 'समाचार' : 'Story',
    evidence: ne ? 'स्रोत र प्रमाण' : 'Evidence',
    distribution: ne ? 'प्रस्तुति र सूचना' : 'Distribution',
    preview: ne ? 'पूर्वावलोकन' : 'Preview',
  }

  function moveTab(current: EditorTab, direction: -1 | 1) {
    const index = EDITOR_TABS.indexOf(current)
    const next = EDITOR_TABS[(index + direction + EDITOR_TABS.length) % EDITOR_TABS.length]
    if (!next) return
    setTab(next)
    window.requestAnimationFrame(() => {
      document.getElementById(`newsroom-tab-${next}`)?.focus()
    })
  }

  return (
    <div className="newsroom-studio">
      <header className="newsroom-studio__topbar">
        <div>
          <h1>{mode === 'edit' ? (ne ? 'ड्राफ्ट सम्पादन' : 'Edit draft') : (ne ? 'नयाँ ड्राफ्ट' : 'New draft')}</h1>
          <p>{lastSavedAt ? (ne ? `अन्तिम सुरक्षित: ${new Date(lastSavedAt).toLocaleTimeString('ne-NP')}` : `Last saved ${new Date(lastSavedAt).toLocaleTimeString('en-GB')}`) : (dirty ? (ne ? 'सुरक्षित नभएका परिवर्तन' : 'Unsaved changes') : (ne ? 'लेख्न तयार' : 'Ready to write'))}</p>
        </div>
        <div className="newsroom-studio__actions">
          <button type="button" onClick={() => submit('draft')} disabled={pending}>{ne ? 'ड्राफ्ट सुरक्षित' : 'Save draft'}</button>
          <button type="button" onClick={() => submit('submitted')} disabled={pending} data-primary="true">{ne ? 'समीक्षामा पठाउनुहोस्' : 'Submit for review'}</button>
        </div>
      </header>

      {status ? <div className="newsroom-studio__status" data-type={status.type} role="status">{status.message}</div> : null}

      <section className="newsroom-assist" aria-label={ne ? 'सम्पादकीय सुझाव' : 'Editorial suggestions'}>
        <div>
          <strong>{ne ? 'सुझाव मात्र; स्वतः सुरक्षित हुँदैन' : 'Suggestions only; never auto-saved'}</strong>
        </div>
        <div className="newsroom-assist__actions">
          {([
            ['summary', ne ? 'सारांश सुझाव' : 'Summary'],
            ['headlines', ne ? 'शीर्षक सुझाव' : 'Headlines'],
            ['tags', ne ? 'ट्याग सुझाव' : 'Tags'],
            ['factCheck', ne ? 'तथ्य-जाँच ढाँचा' : 'Fact-check'],
          ] as const).map(([action, label]) => (
            <button key={action} type="button" disabled={Boolean(assistanceBusy) || !draft.bodyNe.trim()} onClick={() => requestAssistance(action)}>
              {assistanceBusy === action ? (ne ? 'तयार हुँदै…' : 'Preparing…') : label}
            </button>
          ))}
        </div>
        {assistance ? <div className="newsroom-assist__review" role="status">
          <p>{ne ? 'सम्पादकले जाँच गरेर मात्र स्वीकार गर्नुहोस्।' : 'Review this extractive suggestion before accepting it.'}</p>
          {typeof assistance.data === 'string' ? <blockquote>{assistance.data || (ne ? 'सुझाव उपलब्ध भएन।' : 'No suggestion available.')}</blockquote> : null}
          {Array.isArray(assistance.data) ? <ul>{assistance.data.map((item) => <li key={item}><span>{item}</span>{assistance.action === 'headlines' ? <button type="button" onClick={() => acceptAssistance(item)}>{ne ? 'यो स्वीकार' : 'Accept this'}</button> : null}</li>)}</ul> : null}
          {assistance.action === 'factCheck' && !Array.isArray(assistance.data) && typeof assistance.data !== 'string'
            ? <ol>{assistance.data.claims.map((claim, index) => <li key={`${claim.claim}-${index}`}>{claim.claim}</li>)}</ol>
            : null}
          <div className="newsroom-assist__decision">
            {assistance.action !== 'headlines' ? <button type="button" data-accept="true" onClick={() => acceptAssistance()}>{ne ? 'स्वीकार गरी फिल्डमा राख्नुहोस्' : 'Accept into field'}</button> : null}
            <button type="button" onClick={() => setAssistance(null)}>{ne ? 'खारेज' : 'Dismiss'}</button>
          </div>
        </div> : null}
      </section>

      <div className="newsroom-studio__tabs" role="tablist" aria-label={ne ? 'सम्पादक खण्ड' : 'Editor sections'}>
        {EDITOR_TABS.map((key) => <button
          key={key}
          id={`newsroom-tab-${key}`}
          type="button"
          role="tab"
          tabIndex={tab === key ? 0 : -1}
          aria-selected={tab === key}
          aria-controls={`newsroom-panel-${key}`}
          onClick={() => setTab(key)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); moveTab(key, -1) }
            if (event.key === 'ArrowRight') { event.preventDefault(); moveTab(key, 1) }
          }}
        >{labels[key]}{key === 'evidence' && !evidenceReady ? <span aria-label={ne ? 'अपूर्ण' : 'Incomplete'}>!</span> : null}</button>)}
      </div>

      <div className="newsroom-studio__layout">
        <main className="newsroom-studio__canvas" id={`newsroom-panel-${tab}`} role="tabpanel" aria-labelledby={`newsroom-tab-${tab}`} tabIndex={0} data-active-tab={tab}>
          <section className="newsroom-studio__panel" hidden={tab !== 'story'} aria-hidden={tab !== 'story'}>
            <label className="newsroom-field newsroom-field--headline"><span>{ne ? 'नेपाली शीर्षक' : 'Nepali headline'}</span><textarea value={draft.titleNe} onChange={(event) => patch('titleNe', event.target.value)} maxLength={120} rows={2} placeholder={ne ? 'समाचारको ठोस र स्पष्ट शीर्षक' : 'A specific, clear headline'} /></label>
            <div className="newsroom-grid newsroom-grid--two">
              <label className="newsroom-field"><span>{ne ? 'विभाग' : 'Desk'}</span><select value={draft.categorySlug} onChange={(event) => patch('categorySlug', event.target.value)}>{categories.map((category) => <option key={category.slug} value={category.slug}>{ne ? category.nameNe : category.nameEn || category.nameNe}</option>)}</select></label>
              <label className="newsroom-field"><span>URL slug</span><input value={draft.slug} onChange={(event) => patch('slug', slugify(event.target.value))} disabled={mode === 'edit'} /></label>
            </div>
            <label className="newsroom-field"><span>{ne ? 'अंग्रेजी शीर्षक (वैकल्पिक)' : 'English headline (optional)'}</span><input lang="en" value={draft.titleEn} onChange={(event) => patch('titleEn', event.target.value)} maxLength={140} placeholder={ne ? 'मानवीय समीक्षा गरिएको अंग्रेजी शीर्षक मात्र' : 'Use only a human-reviewed translation'} /></label>
            <label className="newsroom-field"><span>{ne ? 'छोटो सारांश' : 'Deck'}</span><textarea value={draft.deckNe} onChange={(event) => patch('deckNe', event.target.value)} rows={3} maxLength={320} placeholder={ne ? 'शीर्षकमा नअटाएको मुख्य सन्दर्भ' : 'The essential context that does not fit in the headline'} /></label>
            <StoryBodyEditor
              locale={locale}
              label={ne ? 'समाचार सामग्री' : 'Story body'}
              value={draft.bodyNe}
              onChange={(next) => patch('bodyNe', next)}
              rows={24}
              required
              density={editorPrefs?.density ?? 'comfortable'}
              showHints={editorPrefs?.showFormattingHints ?? true}
              wordCountLabel={ne ? `${wordCount} शब्द · ~${readingMinutes} मिनेट` : `${wordCount} words · ~${readingMinutes} min`}
            />
          </section>

          <section className="newsroom-studio__panel" hidden={tab !== 'evidence'} aria-hidden={tab !== 'evidence'}>
            <div className="newsroom-studio__section-intro"><h2>{ne ? 'समाचार पुष्टि' : 'Reporting evidence'}</h2><p>{ne ? 'यी विवरण सार्वजनिक सामग्री होइनन्। सम्पादकले रिपोर्टिङको आधार, प्रमाण र जोखिम बुझ्न प्रयोग गर्छन्।' : 'These fields are private to the newsroom. They let editors understand the reporting basis, evidence and risk.'}</p></div>
            <label className="newsroom-field"><span>{ne ? 'रिपोर्टिङ स्थान' : 'Reporting location'}</span><input value={draft.reportingLocation} onChange={(event) => patch('reportingLocation', event.target.value)} placeholder={ne ? 'जिल्ला, पालिका वा घटनास्थल' : 'District, municipality or reporting location'} /></label>
            <label className="newsroom-field"><span>{ne ? 'प्रदेश स्लग' : 'Province slug'}</span><input value={draft.province} onChange={(event) => patch('province', event.target.value)} placeholder="bagmati" /></label>
            <label className="newsroom-field"><span>{ne ? 'जिल्ला स्लग' : 'District slug'}</span><input value={draft.district} onChange={(event) => patch('district', event.target.value)} placeholder="kathmandu" /></label>
            <label className="newsroom-field newsroom-field--check"><span><input type="checkbox" checked={draft.exclusive} onChange={(event) => patch('exclusive', event.target.checked)} /> {ne ? 'विशेष रिपोर्ट' : 'Exclusive'}</span></label>
            <label className="newsroom-field newsroom-field--check"><span><input type="checkbox" checked={draft.editorPick} onChange={(event) => patch('editorPick', event.target.checked)} /> {ne ? 'सम्पादकको रोजाइ' : "Editor's pick"}</span></label>
            <label className="newsroom-field"><span>{ne ? 'स्रोत र प्रमाण नोट' : 'Source and evidence note'}</span><textarea value={draft.sourceNote} onChange={(event) => patch('sourceNote', event.target.value)} rows={8} placeholder={ne ? 'कोसँग कुरा गरियो? कुन कागजात हेरियो? के पुष्टि हुन बाँकी छ?' : 'Who was interviewed? Which documents were reviewed? What remains unverified?'} /></label>
            <section className="newsroom-source-check">
              <h3>{ne ? 'स्रोत विश्वसनीयता संकेत' : 'Source reliability flags'}</h3>
              <p>{ne ? 'यी स्वचालित फैसला होइनन्; URL जाँच्न सम्पादकलाई संकेत मात्र हुन्।' : 'These are review prompts, not automated verdicts.'}</p>
              {sourceChecks.length ? <ul>{sourceChecks.map(({ url, flags }) => <li key={url}><code>{url}</code><span>{flags.length ? flags.join(' · ') : (ne ? 'आधारभूत URL जाँच ठीक' : 'Basic URL checks passed')}</span></li>)}</ul> : <p>{ne ? 'नोटमा URL राखेपछि जाँच संकेत यहाँ देखिन्छ।' : 'Add source URLs to the note to see review flags.'}</p>}
            </section>
            <label className="newsroom-field"><span>{ne ? 'सम्पादकलाई प्रस्ताव' : 'Pitch to editor'}</span><textarea value={draft.editorPitch} onChange={(event) => patch('editorPitch', event.target.value)} rows={5} placeholder={ne ? 'यो समाचार किन अहिले महत्त्वपूर्ण छ?' : 'Why does this story matter now?'} /></label>
            <label className="newsroom-field"><span>{ne ? 'तस्वीर/फाइल सन्दर्भ URL' : 'Media reference URL'}</span><input type="url" value={draft.heroImageUrl} onChange={(event) => patch('heroImageUrl', event.target.value)} /><small>{ne ? 'URL टाँस्नुहोस्, ग्यालरीबाट छान्नुहोस्, वा तल फाइल अपलोड गर्नुहोस्।' : 'Paste a URL, pick from the gallery, or upload a file below.'}</small></label>
            <div className="newsroom-field newsroom-field--actions">
              <button type="button" onClick={() => setHeroGalleryOpen(true)}>
                {ne ? 'मिडिया ग्यालरी' : 'Media gallery'}
              </button>
            </div>
            <div className="newsroom-field">
              <span>{ne ? 'थम्बनेल अपलोड' : 'Thumbnail upload'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={pending}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  startTransition(async () => {
                    const body = new FormData()
                    body.set('file', file)
                    const res = await fetch('/api/admin/media/upload', { method: 'POST', credentials: 'include', body })
                    const data = await res.json().catch(() => ({})) as {
                      error?: string
                      url?: string
                      cmsUrl?: string
                    }
                    if (!res.ok || !data.url) {
                      const detail =
                        data.cmsUrl && res.status === 409
                          ? ne
                            ? `${data.error ?? 'मिडिया Payload CMS मा व्यवस्थापन हुन्छ।'} ${data.cmsUrl}`
                            : `${data.error ?? 'Media is managed in Payload CMS.'} ${data.cmsUrl}`
                          : String(data.error ?? (ne ? 'अपलोड असफल।' : 'Upload failed.'))
                      setStatus({ type: 'error', message: detail })
                      return
                    }
                    patch('heroImageUrl', data.url)
                    setStatus({ type: 'ok', message: ne ? 'तस्वीर अपलोड भयो।' : 'Image uploaded.' })
                  })
                }}
              />
            </div>
            {draft.heroImageUrl ? (
              <figure className="newsroom-hero-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.heroImageUrl} alt="" />
                <figcaption>{ne ? 'सन्दर्भ पूर्वावलोकन' : 'Reference preview'}</figcaption>
              </figure>
            ) : null}
            <MediaGalleryPicker
              locale={locale}
              open={heroGalleryOpen}
              onClose={() => setHeroGalleryOpen(false)}
              onPick={(item: GalleryMediaItem) => {
                patch('heroImageUrl', item.url)
                setStatus({ type: 'ok', message: ne ? 'ग्यालरीबाट छानियो।' : 'Selected from gallery.' })
              }}
              title={ne ? 'हिरो / सन्दर्भ छवि' : 'Hero / reference image'}
            />
          </section>

          <section className="newsroom-studio__panel" hidden={tab !== 'distribution'} aria-hidden={tab !== 'distribution'}>
            <div className="newsroom-studio__section-intro"><h2>{ne ? 'वर्गीकरण र प्रस्तुति' : 'Classification and presentation'}</h2><p>{ne ? 'ट्यागले खोज, सम्बन्धित समाचार र notification eligibility मा मद्दत गर्छ। ब्रेकिङ चिन्ह सम्पादकले अन्तिम रूपमा स्वीकृत गर्छ।' : 'Tags improve search, related stories and notification eligibility. Editors make the final breaking-news decision.'}</p></div>
            <fieldset className="newsroom-tag-picker"><legend>{ne ? 'समाचार ट्याग' : 'Story tags'}</legend>{tags.slice(0, 50).map((tag) => <label key={tag.slug} data-selected={selectedTagSet.has(tag.slug)}><input type="checkbox" checked={selectedTagSet.has(tag.slug)} onChange={() => { const removing = selectedTagSet.has(tag.slug); patch('tagSlugs', removing ? draft.tagSlugs.filter((item) => item !== tag.slug) : [...draft.tagSlugs, tag.slug]); if (removing && selectedNotificationTagSet.has(tag.slug)) patch('notificationTags', draft.notificationTags.filter((item) => item !== tag.slug)) }} /><span>{ne ? tag.nameNe : tag.nameEn || tag.nameNe}</span></label>)}</fieldset>
            <div className="newsroom-grid newsroom-grid--two"><label className="newsroom-field"><span>{ne ? 'गृहपृष्ठ परिचय' : 'Homepage teaser'}</span><textarea value={draft.customHomepageText} onChange={(event) => patch('customHomepageText', event.target.value)} rows={4} maxLength={220} placeholder={ne ? 'गृहपृष्ठमा देखिने छोटो, तथ्यपरक परिचय' : 'A concise, factual homepage introduction'} /></label><label className="newsroom-field"><span>{ne ? 'सामाजिक सञ्जाल प्रति' : 'Social copy'}</span><textarea value={draft.customSocialText} onChange={(event) => patch('customSocialText', event.target.value)} rows={4} maxLength={280} placeholder={ne ? 'अतिरञ्जना नगरी सामाजिक सञ्जालका लागि सन्दर्भ' : 'Context for social distribution without clickbait'} /></label></div>
            <fieldset className="newsroom-radio"><legend>{ne ? 'सूचना सिफारिस' : 'Notification recommendation'}</legend>{([['none', ne ? 'सूचना नपठाउने' : 'No alert'],['followers', ne ? 'सम्बन्धित विषय पछ्याउनेलाई' : 'Followers of matching topics'],['breaking', ne ? 'ब्रेकिङका रूपमा प्रस्ताव' : 'Propose as breaking']] as const).map(([value,label]) => <label key={value}><input type="radio" name="notificationMode" value={value} checked={draft.notificationMode === value} onChange={() => patch('notificationMode', value)} /><span>{label}</span></label>)}</fieldset>
            {draft.notificationMode !== 'none' ? <fieldset className="newsroom-tag-picker newsroom-tag-picker--alerts"><legend>{ne ? 'सूचना पठाउने लक्षित विषय' : 'Alert audience topics'}</legend><p>{ne ? 'खाली राखेमा समाचारका सबै ट्याग प्रयोग हुन्छन्। यहाँ छानिएको ट्याग समाचारको ट्यागभित्रै हुनुपर्छ।' : 'Leave empty to inherit all story tags. Alert targets must be a subset of the story tags.'}</p>{draft.tagSlugs.length ? draft.tagSlugs.map((slug) => { const tag = tags.find((item) => item.slug === slug); return <label key={slug} data-selected={selectedNotificationTagSet.has(slug)}><input type="checkbox" checked={selectedNotificationTagSet.has(slug)} onChange={() => patch('notificationTags', selectedNotificationTagSet.has(slug) ? draft.notificationTags.filter((item) => item !== slug) : [...draft.notificationTags, slug])} /><span>{tag ? (ne ? tag.nameNe : tag.nameEn || tag.nameNe) : slug}</span></label> }) : <span className="newsroom-tag-picker__empty">{ne ? 'पहिला समाचार ट्याग छान्नुहोस्।' : 'Select story tags first.'}</span>}</fieldset> : null}
          </section>

          <section className="newsroom-studio__panel" hidden={tab !== 'preview'} aria-hidden={tab !== 'preview'}>
            <article className="newsroom-preview" lang="ne">
              <p>{categories.find((item) => item.slug === draft.categorySlug)?.nameNe ?? draft.categorySlug}</p>
              <h2>{draft.titleNe || 'शीर्षक यहाँ देखिन्छ'}</h2>
              {draft.deckNe ? <h3>{draft.deckNe}</h3> : null}
              <div>
                {draft.bodyNe.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h4 key={index}>
                        <RichInlineText text={paragraph.replace(/^##\s*/, '')} />
                      </h4>
                    )
                  }
                  if (paragraph.startsWith('> ')) {
                    return (
                      <blockquote key={index}>
                        <RichInlineText text={paragraph.replace(/^>\s*/, '')} />
                      </blockquote>
                    )
                  }
                  if (paragraph.startsWith('![') && paragraph.includes('](')) {
                    return <p key={index} className="newsroom-preview__media">{ne ? '[छवि]' : '[image]'}</p>
                  }
                  return (
                    <p key={index}>
                      <RichInlineText text={paragraph} />
                    </p>
                  )
                })}
              </div>
            </article>
          </section>
        </main>

        <aside className="newsroom-studio__rail">
          <section><h3>{ne ? 'प्रगति' : 'Progress'}</h3><dl><div><dt>{ne ? 'शब्द' : 'Words'}</dt><dd>{wordCount}</dd></div><div><dt>{ne ? 'पढाइ समय' : 'Read time'}</dt><dd>{readingMinutes} {ne ? 'मिनेट' : 'min'}</dd></div><div><dt>{ne ? 'ट्याग' : 'Tags'}</dt><dd>{draft.tagSlugs.length}</dd></div></dl></section>
          <section><h3>{ne ? 'पेश गर्नुअघि' : 'Before review'}</h3><ul><li data-ready={Boolean(draft.titleNe)}>{ne ? 'ठोस शीर्षक' : 'Specific headline'}</li><li data-ready={storyReady}>{ne ? 'पर्याप्त समाचार सामग्री' : 'Substantive story body'}</li><li data-ready={Boolean(draft.reportingLocation)}>{ne ? 'रिपोर्टिङ स्थान' : 'Reporting location'}</li><li data-ready={draft.sourceNote.length >= 20}>{ne ? 'स्रोत/प्रमाण नोट' : 'Source/evidence note'}</li><li data-ready={draft.tagSlugs.length > 0}>{ne ? 'कम्तीमा एउटा ट्याग' : 'At least one tag'}</li></ul></section>
          <section className="newsroom-distribution-brief"><h3>{ne ? 'यो समाचार कसरी पुग्छ' : 'How this story can travel'}</h3><dl><div><dt>{ne ? 'विभाग' : 'Desk'}</dt><dd>{categories.find((item) => item.slug === draft.categorySlug)?.[ne ? 'nameNe' : 'nameEn'] || draft.categorySlug || '—'}</dd></div><div><dt>{ne ? 'समाचार ट्याग' : 'Story tags'}</dt><dd>{selectedTags.length ? selectedTags.map((tag) => ne ? tag.nameNe : tag.nameEn || tag.nameNe).join(' · ') : (ne ? 'छानिएको छैन' : 'None selected')}</dd></div><div><dt>{ne ? 'सूचना प्रस्ताव' : 'Alert proposal'}</dt><dd>{draft.notificationMode === 'breaking' ? (ne ? 'ब्रेकिङ समीक्षा' : 'Breaking review') : draft.notificationMode === 'followers' ? (ne ? 'सम्बन्धित पाठक' : 'Matching followers') : (ne ? 'सूचना छैन' : 'No alert')}</dd></div>{draft.notificationMode !== 'none' ? <div><dt>{ne ? 'लक्षित विषय' : 'Audience topics'}</dt><dd>{alertAudienceTags.length ? alertAudienceTags.map((tag) => ne ? tag.nameNe : tag.nameEn || tag.nameNe).join(' · ') : (ne ? 'समाचार ट्यागबाट स्वतः' : 'Inherited from story tags')}</dd></div> : null}</dl><p>{ne ? 'यो रिपोर्टरको सिफारिस मात्र हो। प्रकाशन, ब्रेकिङ स्थिति र वास्तविक सूचना पठाउने निर्णय सम्पादकीय gate पछि मात्र हुन्छ।' : 'This is a reporter recommendation. Publication, breaking status and actual delivery remain behind the editorial gate.'}</p></section>
          {initial?.workflowStage ? <section><h3>{ne ? 'कार्यप्रवाह' : 'Workflow'}</h3><strong className="newsroom-studio__stage">{initial.workflowStage}</strong>{initial.workflowStage === 'submitted' ? <p>{ne ? 'सम्पादकले समीक्षा गरिरहेका छन्। संशोधन चाहिँदा प्रतिक्रिया डेस्कमा देखिन्छ।' : 'An editor is reviewing this story. Revision requests appear in the feedback desk.'}</p> : null}</section> : null}
          {mode === 'edit' ? <section className="newsroom-revisions">
            <h3>{ne ? 'संशोधन तुलना' : 'Revision compare'}</h3>
            {revisions.length ? <ol>{revisions.map((revision, index) => {
              const action = revision.action === 'submitted'
                ? (ne ? 'समीक्षामा पठाइयो' : 'Submitted for review')
                : revision.action === 'returned'
                  ? (ne ? 'सम्पादकले फिर्ता पठाए' : 'Returned by editor')
                  : (ne ? 'ड्राफ्ट सुरक्षित' : 'Draft saved')
              const previous = revisions[index + 1]
              const overlap =
                typeof revision.similarityToPrevious === 'number'
                  ? Math.round(revision.similarityToPrevious * 100)
                  : null
              const wordDelta =
                previous?.bodyNe && revision.bodyNe
                  ? revision.bodyNe.trim().split(/\s+/).filter(Boolean).length -
                    previous.bodyNe.trim().split(/\s+/).filter(Boolean).length
                  : null
              return <li key={revision.id}>
                <strong>{action}</strong>
                <span>{new Date(revision.createdAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}</span>
                <small>{revision.actorRole} · {revision.stage} · {revision.contentHash.slice(0, 10)}</small>
                <p>{revision.titleNe}</p>
                {revision.deckNe ? <p className="newsroom-revisions__deck">{revision.deckNe}</p> : null}
                {overlap !== null ? (
                  <p>
                    {ne ? 'अघिल्लो संस्करणसँग सामग्री समानता' : 'Overlap with previous version'}: {overlap}%
                    {wordDelta !== null ? ` · ${wordDelta >= 0 ? '+' : ''}${wordDelta} ${ne ? 'शब्द' : 'words'}` : ''}
                  </p>
                ) : null}
                {revision.bodyNe ? (
                  <details>
                    <summary>{ne ? 'पाठ हेर्नुहोस्' : 'View text'}</summary>
                    <pre className="newsroom-revisions__body">{revision.bodyNe.slice(0, 4000)}</pre>
                  </details>
                ) : null}
              </li>
            })}</ol> : <p>{ne ? 'अर्को सुरक्षित वा पेश गरिएको संस्करण यहाँ देखिनेछ।' : 'The next saved or submitted version will appear here.'}</p>}
          </section> : null}
        </aside>
      </div>
    </div>
  )
}
