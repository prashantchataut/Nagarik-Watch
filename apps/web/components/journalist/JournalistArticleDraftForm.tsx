'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, Locale, Tag } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

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
}

type Props = {
  locale: Locale
  categories: Category[]
  tags: Tag[]
  mode?: 'create' | 'edit'
  articleId?: string
  initial?: Partial<DraftValues>
}

const empty: DraftValues = {
  titleNe: '', titleEn: '', slug: '', categorySlug: '', deckNe: '', bodyNe: '', tagSlugs: [],
  heroImageUrl: '', reportingLocation: '', sourceNote: '', editorPitch: '', customHomepageText: '',
  customSocialText: '', notificationMode: 'none', notificationTags: [], workflowStage: 'draft',
}

const EDITOR_TABS = ['story', 'evidence', 'distribution', 'preview'] as const
type EditorTab = (typeof EDITOR_TABS)[number]

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0900-\u097F]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function JournalistArticleDraftForm({ locale, categories, tags, mode = 'create', articleId, initial }: Props) {
  const ne = locale === 'ne'
  const router = useRouter()
  const [draft, setDraft] = useState<DraftValues>({ ...empty, categorySlug: categories[0]?.slug ?? '', ...initial })
  const [tab, setTab] = useState<EditorTab>('story')
  const [status, setStatus] = useState<{ type: 'ok' | 'error' | 'saving'; message: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const saveRef = useRef<(stage: 'draft' | 'submitted', silent?: boolean) => void>(() => undefined)

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
    if (mode !== 'create' || !dirty) return
    const timer = window.setTimeout(() => {
      try { sessionStorage.setItem(localRecoveryKey, JSON.stringify(draft)) } catch {}
    }, 800)
    return () => window.clearTimeout(timer)
  }, [dirty, draft, localRecoveryKey, mode])

  useEffect(() => {
    if (mode !== 'edit') return
    const timer = window.setInterval(() => {
      if (dirty && !pending) saveRef.current('draft', true)
    }, 30_000)
    return () => window.clearInterval(timer)
  }, [dirty, mode, pending])

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
      document.getElementById(`writer-tab-${next}`)?.focus()
    })
  }

  return (
    <div className="writer-studio">
      <header className="writer-studio__topbar">
        <div>
          <p className="editorial-kicker" lang="en">Nagarik Watch newsroom</p>
          <h1>{mode === 'edit' ? (ne ? 'ड्राफ्ट सम्पादन' : 'Edit draft') : (ne ? 'नयाँ समाचार' : 'New story')}</h1>
          <p>{lastSavedAt ? (ne ? `अन्तिम सुरक्षित: ${new Date(lastSavedAt).toLocaleTimeString('ne-NP')}` : `Last saved ${new Date(lastSavedAt).toLocaleTimeString('en-GB')}`) : (dirty ? (ne ? 'सुरक्षित नभएका परिवर्तन' : 'Unsaved changes') : (ne ? 'लेख्न तयार' : 'Ready to write'))}</p>
        </div>
        <div className="writer-studio__actions">
          <button type="button" onClick={() => submit('draft')} disabled={pending}>{ne ? 'ड्राफ्ट सुरक्षित' : 'Save draft'}</button>
          <button type="button" onClick={() => submit('submitted')} disabled={pending} data-primary="true">{ne ? 'समीक्षामा पठाउनुहोस्' : 'Submit for review'}</button>
        </div>
      </header>

      {status ? <div className="writer-studio__status" data-type={status.type} role="status">{status.message}</div> : null}

      <div className="writer-studio__tabs" role="tablist" aria-label={ne ? 'सम्पादक खण्ड' : 'Editor sections'}>
        {EDITOR_TABS.map((key) => <button
          key={key}
          id={`writer-tab-${key}`}
          type="button"
          role="tab"
          tabIndex={tab === key ? 0 : -1}
          aria-selected={tab === key}
          aria-controls={`writer-panel-${key}`}
          onClick={() => setTab(key)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); moveTab(key, -1) }
            if (event.key === 'ArrowRight') { event.preventDefault(); moveTab(key, 1) }
          }}
        >{labels[key]}{key === 'evidence' && !evidenceReady ? <span aria-label={ne ? 'अपूर्ण' : 'Incomplete'}>!</span> : null}</button>)}
      </div>

      <div className="writer-studio__layout">
        <main className="writer-studio__canvas" id={`writer-panel-${tab}`} role="tabpanel" aria-labelledby={`writer-tab-${tab}`} tabIndex={0}>
          {tab === 'story' ? <>
            <label className="writer-field writer-field--headline"><span>{ne ? 'नेपाली शीर्षक' : 'Nepali headline'}</span><textarea value={draft.titleNe} onChange={(event) => patch('titleNe', event.target.value)} maxLength={120} rows={2} placeholder={ne ? 'समाचारको ठोस र स्पष्ट शीर्षक' : 'A specific, clear headline'} /></label>
            <div className="writer-grid writer-grid--two">
              <label className="writer-field"><span>{ne ? 'विभाग' : 'Desk'}</span><select value={draft.categorySlug} onChange={(event) => patch('categorySlug', event.target.value)}>{categories.map((category) => <option key={category.slug} value={category.slug}>{ne ? category.nameNe : category.nameEn || category.nameNe}</option>)}</select></label>
              <label className="writer-field"><span>URL slug</span><input value={draft.slug} onChange={(event) => patch('slug', slugify(event.target.value))} disabled={mode === 'edit'} /></label>
            </div>
            <label className="writer-field"><span>{ne ? 'अंग्रेजी शीर्षक (वैकल्पिक)' : 'English headline (optional)'}</span><input lang="en" value={draft.titleEn} onChange={(event) => patch('titleEn', event.target.value)} maxLength={140} placeholder={ne ? 'मानवीय समीक्षा गरिएको अंग्रेजी शीर्षक मात्र' : 'Use only a human-reviewed translation'} /></label>
            <label className="writer-field"><span>{ne ? 'छोटो सारांश' : 'Deck'}</span><textarea value={draft.deckNe} onChange={(event) => patch('deckNe', event.target.value)} rows={3} maxLength={320} placeholder={ne ? 'शीर्षकमा नअटाएको मुख्य सन्दर्भ' : 'The essential context that does not fit in the headline'} /></label>
            <label className="writer-field writer-field--body"><span>{ne ? 'समाचार सामग्री' : 'Story body'}</span><textarea value={draft.bodyNe} onChange={(event) => patch('bodyNe', event.target.value)} rows={24} placeholder={ne ? 'अनुच्छेद छुट्याउन खाली लाइन राख्नुहोस्। ## उपशीर्षक, > उद्धरण, - सूची प्रयोग गर्न सकिन्छ।' : 'Use blank lines between paragraphs. ## subhead, > quote and - list are supported.'} /></label>
          </> : null}

          {tab === 'evidence' ? <>
            <div className="writer-studio__section-intro"><h2>{ne ? 'समाचार पुष्टि' : 'Reporting evidence'}</h2><p>{ne ? 'यी विवरण सार्वजनिक सामग्री होइनन्। सम्पादकले रिपोर्टिङको आधार, प्रमाण र जोखिम बुझ्न प्रयोग गर्छन्।' : 'These fields are private to the newsroom. They let editors understand the reporting basis, evidence and risk.'}</p></div>
            <label className="writer-field"><span>{ne ? 'रिपोर्टिङ स्थान' : 'Reporting location'}</span><input value={draft.reportingLocation} onChange={(event) => patch('reportingLocation', event.target.value)} placeholder={ne ? 'जिल्ला, पालिका वा घटनास्थल' : 'District, municipality or reporting location'} /></label>
            <label className="writer-field"><span>{ne ? 'स्रोत र प्रमाण नोट' : 'Source and evidence note'}</span><textarea value={draft.sourceNote} onChange={(event) => patch('sourceNote', event.target.value)} rows={8} placeholder={ne ? 'कोसँग कुरा गरियो? कुन कागजात हेरियो? के पुष्टि हुन बाँकी छ?' : 'Who was interviewed? Which documents were reviewed? What remains unverified?'} /></label>
            <label className="writer-field"><span>{ne ? 'सम्पादकलाई प्रस्ताव' : 'Pitch to editor'}</span><textarea value={draft.editorPitch} onChange={(event) => patch('editorPitch', event.target.value)} rows={5} placeholder={ne ? 'यो समाचार किन अहिले महत्त्वपूर्ण छ?' : 'Why does this story matter now?'} /></label>
            <label className="writer-field"><span>{ne ? 'तस्वीर/फाइल सन्दर्भ URL' : 'Media reference URL'}</span><input type="url" value={draft.heroImageUrl} onChange={(event) => patch('heroImageUrl', event.target.value)} /><small>{ne ? 'यो सन्दर्भ मात्र हो। प्रकाशनअघि अधिकार पुष्टि गरी Media library मा फाइल अपलोड गर्नुपर्छ।' : 'Reference only. An editor must verify rights and upload the asset to the Media library before publication.'}</small></label>
          </> : null}

          {tab === 'distribution' ? <>
            <div className="writer-studio__section-intro"><h2>{ne ? 'वर्गीकरण र प्रस्तुति' : 'Classification and presentation'}</h2><p>{ne ? 'ट्यागले खोज, सम्बन्धित समाचार र notification eligibility मा मद्दत गर्छ। ब्रेकिङ चिन्ह सम्पादकले अन्तिम रूपमा स्वीकृत गर्छ।' : 'Tags improve search, related stories and notification eligibility. Editors make the final breaking-news decision.'}</p></div>
            <fieldset className="writer-tag-picker"><legend>{ne ? 'समाचार ट्याग' : 'Story tags'}</legend>{tags.slice(0, 50).map((tag) => <label key={tag.slug} data-selected={selectedTagSet.has(tag.slug)}><input type="checkbox" checked={selectedTagSet.has(tag.slug)} onChange={() => { const removing = selectedTagSet.has(tag.slug); patch('tagSlugs', removing ? draft.tagSlugs.filter((item) => item !== tag.slug) : [...draft.tagSlugs, tag.slug]); if (removing && selectedNotificationTagSet.has(tag.slug)) patch('notificationTags', draft.notificationTags.filter((item) => item !== tag.slug)) }} /><span>{ne ? tag.nameNe : tag.nameEn || tag.nameNe}</span></label>)}</fieldset>
            <div className="writer-grid writer-grid--two"><label className="writer-field"><span>{ne ? 'गृहपृष्ठ परिचय' : 'Homepage teaser'}</span><textarea value={draft.customHomepageText} onChange={(event) => patch('customHomepageText', event.target.value)} rows={4} maxLength={220} placeholder={ne ? 'गृहपृष्ठमा देखिने छोटो, तथ्यपरक परिचय' : 'A concise, factual homepage introduction'} /></label><label className="writer-field"><span>{ne ? 'सामाजिक सञ्जाल प्रति' : 'Social copy'}</span><textarea value={draft.customSocialText} onChange={(event) => patch('customSocialText', event.target.value)} rows={4} maxLength={280} placeholder={ne ? 'अतिरञ्जना नगरी सामाजिक सञ्जालका लागि सन्दर्भ' : 'Context for social distribution without clickbait'} /></label></div>
            <fieldset className="writer-radio"><legend>{ne ? 'सूचना सिफारिस' : 'Notification recommendation'}</legend>{([['none', ne ? 'सूचना नपठाउने' : 'No alert'],['followers', ne ? 'सम्बन्धित विषय पछ्याउनेलाई' : 'Followers of matching topics'],['breaking', ne ? 'ब्रेकिङका रूपमा प्रस्ताव' : 'Propose as breaking']] as const).map(([value,label]) => <label key={value}><input type="radio" name="notificationMode" value={value} checked={draft.notificationMode === value} onChange={() => patch('notificationMode', value)} /><span>{label}</span></label>)}</fieldset>
            {draft.notificationMode !== 'none' ? <fieldset className="writer-tag-picker writer-tag-picker--alerts"><legend>{ne ? 'सूचना पठाउने लक्षित विषय' : 'Alert audience topics'}</legend><p>{ne ? 'खाली राखेमा समाचारका सबै ट्याग प्रयोग हुन्छन्। यहाँ छानिएको ट्याग समाचारको ट्यागभित्रै हुनुपर्छ।' : 'Leave empty to inherit all story tags. Alert targets must be a subset of the story tags.'}</p>{draft.tagSlugs.length ? draft.tagSlugs.map((slug) => { const tag = tags.find((item) => item.slug === slug); return <label key={slug} data-selected={selectedNotificationTagSet.has(slug)}><input type="checkbox" checked={selectedNotificationTagSet.has(slug)} onChange={() => patch('notificationTags', selectedNotificationTagSet.has(slug) ? draft.notificationTags.filter((item) => item !== slug) : [...draft.notificationTags, slug])} /><span>{tag ? (ne ? tag.nameNe : tag.nameEn || tag.nameNe) : slug}</span></label> }) : <span className="writer-tag-picker__empty">{ne ? 'पहिला समाचार ट्याग छान्नुहोस्।' : 'Select story tags first.'}</span>}</fieldset> : null}
          </> : null}

          {tab === 'preview' ? <article className="writer-preview" lang="ne"><p>{categories.find((item) => item.slug === draft.categorySlug)?.nameNe ?? draft.categorySlug}</p><h2>{draft.titleNe || 'शीर्षक यहाँ देखिन्छ'}</h2>{draft.deckNe ? <h3>{draft.deckNe}</h3> : null}<div>{draft.bodyNe.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => paragraph.startsWith('## ') ? <h4 key={index}>{paragraph.replace(/^##\s*/, '')}</h4> : paragraph.startsWith('> ') ? <blockquote key={index}>{paragraph.replace(/^>\s*/, '')}</blockquote> : <p key={index}>{paragraph}</p>)}</div></article> : null}
        </main>

        <aside className="writer-studio__rail">
          <section><p className="editorial-kicker" lang="en">Live check</p><dl><div><dt>{ne ? 'शब्द' : 'Words'}</dt><dd>{wordCount}</dd></div><div><dt>{ne ? 'पढाइ समय' : 'Read time'}</dt><dd>{readingMinutes} {ne ? 'मिनेट' : 'min'}</dd></div><div><dt>{ne ? 'ट्याग' : 'Tags'}</dt><dd>{draft.tagSlugs.length}</dd></div></dl></section>
          <section><h3>{ne ? 'पेश गर्नुअघि' : 'Before review'}</h3><ul><li data-ready={Boolean(draft.titleNe)}>{ne ? 'ठोस शीर्षक' : 'Specific headline'}</li><li data-ready={storyReady}>{ne ? 'पर्याप्त समाचार सामग्री' : 'Substantive story body'}</li><li data-ready={Boolean(draft.reportingLocation)}>{ne ? 'रिपोर्टिङ स्थान' : 'Reporting location'}</li><li data-ready={draft.sourceNote.length >= 20}>{ne ? 'स्रोत/प्रमाण नोट' : 'Source/evidence note'}</li><li data-ready={draft.tagSlugs.length > 0}>{ne ? 'कम्तीमा एउटा ट्याग' : 'At least one tag'}</li></ul></section>
          <section className="writer-distribution-brief"><p className="editorial-kicker" lang="en">Distribution brief</p><h3>{ne ? 'यो समाचार कसरी पुग्छ' : 'How this story can travel'}</h3><dl><div><dt>{ne ? 'विभाग' : 'Desk'}</dt><dd>{categories.find((item) => item.slug === draft.categorySlug)?.[ne ? 'nameNe' : 'nameEn'] || draft.categorySlug || '—'}</dd></div><div><dt>{ne ? 'समाचार ट्याग' : 'Story tags'}</dt><dd>{selectedTags.length ? selectedTags.map((tag) => ne ? tag.nameNe : tag.nameEn || tag.nameNe).join(' · ') : (ne ? 'छानिएको छैन' : 'None selected')}</dd></div><div><dt>{ne ? 'सूचना प्रस्ताव' : 'Alert proposal'}</dt><dd>{draft.notificationMode === 'breaking' ? (ne ? 'ब्रेकिङ समीक्षा' : 'Breaking review') : draft.notificationMode === 'followers' ? (ne ? 'सम्बन्धित पाठक' : 'Matching followers') : (ne ? 'सूचना छैन' : 'No alert')}</dd></div>{draft.notificationMode !== 'none' ? <div><dt>{ne ? 'लक्षित विषय' : 'Audience topics'}</dt><dd>{alertAudienceTags.length ? alertAudienceTags.map((tag) => ne ? tag.nameNe : tag.nameEn || tag.nameNe).join(' · ') : (ne ? 'समाचार ट्यागबाट स्वतः' : 'Inherited from story tags')}</dd></div> : null}</dl><p>{ne ? 'यो रिपोर्टरको सिफारिस मात्र हो। प्रकाशन, ब्रेकिङ स्थिति र वास्तविक सूचना पठाउने निर्णय सम्पादकीय gate पछि मात्र हुन्छ।' : 'This is a reporter recommendation. Publication, breaking status and actual delivery remain behind the editorial gate.'}</p></section>
          {initial?.workflowStage ? <section><h3>{ne ? 'कार्यप्रवाह' : 'Workflow'}</h3><strong className="writer-studio__stage">{initial.workflowStage}</strong>{initial.workflowStage === 'submitted' ? <p>{ne ? 'सम्पादकले समीक्षा गरिरहेका छन्। संशोधन चाहिँदा प्रतिक्रिया डेस्कमा देखिन्छ।' : 'An editor is reviewing this story. Revision requests appear in the feedback desk.'}</p> : null}</section> : null}
        </aside>
      </div>
    </div>
  )
}
