'use client'

import { useEffect, useState, useTransition } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'

type Props = {
  locale: Locale
  categories: Category[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function JournalistArticleDraftForm({ locale, categories }: Props) {
  const ne = locale === 'ne'
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; message: string } | null>(null)
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title))
  }, [slugTouched, title])

  function submit(stage: 'draft' | 'submitted') {
    const form = document.querySelector<HTMLFormElement>('[data-journalist-draft-form]')
    if (!form) return
    setStatus(null)
    const data = new FormData(form)
    const titleNe = String(data.get('titleNe') ?? '').trim()
    const categorySlug = String(data.get('categorySlug') ?? '').trim()
    const bodyNe = String(data.get('bodyNe') ?? '').trim()
    const slug = String(data.get('slug') ?? '').trim() || slugify(titleNe)

    if (!titleNe || !categorySlug || !bodyNe || !slug) {
      setStatus({ type: 'error', message: ne ? 'शीर्षक, विभाग र सामग्री आवश्यक छन्।' : 'Title, category and body are required.' })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/journalist/articles', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            titleNe,
            titleEn: String(data.get('titleEn') ?? '').trim() || undefined,
            slug,
            categorySlug,
            deckNe: String(data.get('deckNe') ?? '').trim() || undefined,
            bodyNe,
            heroImageUrl: String(data.get('heroImageUrl') ?? '').trim() || undefined,
            heroImageAlt: titleNe,
            tagSlugs: String(data.get('tags') ?? '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
            workflowStage: stage,
            sourceType: 'original',
            reportingLocation: String(data.get('reportingLocation') ?? '').trim() || undefined,
            sourceNote: String(data.get('sourceNote') ?? '').trim() || undefined,
            editorPitch: String(data.get('editorPitch') ?? '').trim() || undefined,
            customHomepageText: String(data.get('customHomepageText') ?? '').trim() || undefined,
            customSocialText: String(data.get('customSocialText') ?? '').trim() || undefined,
            locale,
            noIndex: true,
            includeInNewsSitemap: false,
          }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          setStatus({ type: 'error', message: String(body?.error ?? (ne ? 'सुरक्षित गर्न सकिएन।' : 'Could not save.')) })
          return
        }
        form.reset()
        setTitle('')
        setSlug('')
        setSlugTouched(false)
        setStatus({ type: 'ok', message: stage === 'submitted' ? (ne ? 'लेख समीक्षाका लागि पेश भयो।' : 'Article submitted for review.') : (ne ? 'ड्राफ्ट सुरक्षित भयो।' : 'Draft saved.') })
      } catch {
        setStatus({ type: 'error', message: ne ? 'नेटवर्क त्रुटि।' : 'Network error.' })
      }
    })
  }

  return (
    <form data-journalist-draft-form className="mt-6 grid gap-4" onSubmit={(event) => event.preventDefault()}>
      {status ? (
        <div role="status" className={`rounded-md border px-4 py-3 text-meta font-semibold ${status.type === 'ok' ? 'border-brand/30 bg-brand-tint text-brand-strong' : 'border-breaking/30 bg-surface text-breaking'}`}>
          {status.message}
        </div>
      ) : null}

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'शीर्षक' : 'Title'}
        <input name="titleNe" value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" required />
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'English title' : 'English title'}
        <input name="titleEn" className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" />
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        URL slug
        <input name="slug" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value) }} className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" />
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'विभाग' : 'Category'}
        <select className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" name="categorySlug" required>
          {categories.map((category) => <option key={category.slug} value={category.slug}>{ne ? category.nameNe : category.nameEn || category.nameNe}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'छोटो सारांश' : 'Deck'}
        <input name="deckNe" className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" />
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'ट्याग' : 'Tags'}
        <input className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" name="tags" placeholder={ne ? 'कमा छुट्याएर लेख्नुहोस्' : 'Comma separated'} />
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'मुख्य तस्वीर URL' : 'Hero image URL'}
        <input className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" name="heroImageUrl" type="url" />
      </label>
      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'सामग्री' : 'Body'}
        <textarea className="min-h-72 rounded-md border border-rule bg-surface px-3.5 py-3 text-body text-ink" name="bodyNe" required />
      </label>
      <section className="rounded-xl border border-rule bg-surface-raised p-4">
        <h2 className="font-display text-h2 text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'सम्पादकका लागि सन्दर्भ' : 'Editor handoff'}
        </h2>
        <p className="mt-1 text-caption text-mute" lang={ne ? 'ne' : 'en'}>
          {ne ? 'यी नोटहरू प्रकाशन copy होइनन्; editor review, homepage treatment र social copy का लागि हुन्।' : 'These fields are not public article copy. They help editors review, place and promote the story.'}
        </p>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-meta font-semibold text-ink">
            {ne ? 'रिपोर्टिङ स्थान' : 'Reporting location'}
            <input name="reportingLocation" className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink" />
          </label>
          <label className="grid gap-1.5 text-meta font-semibold text-ink">
            {ne ? 'स्रोत/प्रमाण नोट' : 'Source and evidence note'}
            <textarea name="sourceNote" className="min-h-24 rounded-md border border-rule bg-surface px-3.5 py-3 text-body text-ink" />
          </label>
          <label className="grid gap-1.5 text-meta font-semibold text-ink">
            {ne ? 'सम्पादकलाई pitch' : 'Pitch to editor'}
            <textarea name="editorPitch" className="min-h-24 rounded-md border border-rule bg-surface px-3.5 py-3 text-body text-ink" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-meta font-semibold text-ink">
              {ne ? 'Homepage teaser' : 'Homepage teaser'}
              <textarea name="customHomepageText" maxLength={220} className="min-h-20 rounded-md border border-rule bg-surface px-3.5 py-3 text-body text-ink" />
            </label>
            <label className="grid gap-1.5 text-meta font-semibold text-ink">
              {ne ? 'Social post draft' : 'Social post draft'}
              <textarea name="customSocialText" maxLength={280} className="min-h-20 rounded-md border border-rule bg-surface px-3.5 py-3 text-body text-ink" />
            </label>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => submit('draft')} disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full border border-rule px-5 text-body font-bold text-ink hover:border-brand hover:text-brand-strong disabled:opacity-60">
          {pending ? (ne ? 'सुरक्षित हुँदै…' : 'Saving…') : ne ? 'ड्राफ्ट सुरक्षित' : 'Save draft'}
        </button>
        <button type="button" onClick={() => submit('submitted')} disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-surface hover:bg-brand-strong disabled:opacity-60">
          {pending ? (ne ? 'पेश हुँदै…' : 'Submitting…') : ne ? 'समीक्षामा पेश' : 'Submit for review'}
        </button>
      </div>
    </form>
  )
}
