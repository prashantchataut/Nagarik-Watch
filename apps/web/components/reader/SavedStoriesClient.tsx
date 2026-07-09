'use client'

import { useEffect, useMemo, useState } from 'react'

type SavedStory = {
  slug?: string
  href?: string
  title?: string
  titleNe?: string
  titleEn?: string
  categorySlug?: string
  savedAt?: string
}

const STORAGE_KEYS = ['nw-bookmarks', 'nagarik-watch-bookmarks', 'savedStories', 'bookmarkedStories']

function normalize(raw: unknown): SavedStory[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return { href: item, title: item }
        if (item && typeof item === 'object') return item as SavedStory
        return null
      })
      .filter((item): item is SavedStory => item !== null)
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>)
      .map((item) => (item && typeof item === 'object' ? (item as SavedStory) : null))
      .filter((item): item is SavedStory => item !== null)
  }
  return []
}

function readSaved(): SavedStory[] {
  const collected: SavedStory[] = []
  for (const key of STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      collected.push(...normalize(JSON.parse(raw)))
    } catch {
      // Ignore corrupt client-side storage; the reader can clear saved items below.
    }
  }
  const seen = new Set<string>()
  return collected.filter((story) => {
    const id = story.href ?? story.slug ?? story.title ?? story.titleNe ?? story.titleEn ?? ''
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function SavedStoriesClient({ locale }: { locale: 'ne' | 'en' }) {
  const ne = locale === 'ne'
  const [stories, setStories] = useState<SavedStory[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setStories(readSaved())
    setReady(true)
  }, [])

  const countLabel = useMemo(() => {
    if (!ready) return ne ? 'लोड हुँदै…' : 'Loading…'
    return ne ? `${stories.length} सुरक्षित कथा` : `${stories.length} saved stories`
  }, [ne, ready, stories.length])

  function clearAll() {
    for (const key of STORAGE_KEYS) window.localStorage.removeItem(key)
    setStories([])
  }

  return (
    <section className="mx-auto max-w-page px-4 py-10">
      <div className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
          Reader library
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-extrabold text-ink" lang={ne ? 'ne' : 'en'}>
              {ne ? 'तपाईंका सुरक्षित समाचार' : 'Your saved stories'}
            </h1>
            <p className="mt-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {ne ? 'यो reader-facing ठाउँ हो; admin वा journalist workspace होइन।' : 'This is the reader-facing space, separate from admin and journalist workspaces.'}
            </p>
          </div>
          <span className="rounded-full border border-rule px-3 py-1.5 text-meta font-semibold text-ink-soft">
            {countLabel}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {stories.length ? stories.map((story, index) => {
          const title = (ne ? story.titleNe : story.titleEn) || story.title || story.titleNe || story.titleEn || story.slug || story.href || 'Saved story'
          const href = story.href || (story.categorySlug && story.slug ? `/${ne ? '' : 'en/'}${story.categorySlug}/${story.slug}` : '#')
          return (
            <article key={`${href}-${index}`} className="rounded-xl border border-rule bg-surface-raised p-5 transition hover:border-brand/40">
              <a href={href} className="font-display text-h1 font-bold text-ink hover:text-brand-strong">
                {title}
              </a>
              <p className="mt-2 text-caption text-mute" lang="en">
                {story.savedAt ? `Saved ${new Date(story.savedAt).toLocaleString()}` : 'Saved locally on this device'}
              </p>
            </article>
          )
        }) : (
          <div className="rounded-xl border border-dashed border-rule bg-surface-raised p-8 text-center">
            <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
              {ready ? (ne ? 'अहिले कुनै सुरक्षित समाचार छैन।' : 'No saved stories yet.') : (ne ? 'लोड हुँदै…' : 'Loading…')}
            </h2>
            <p className="mx-auto mt-2 max-w-body text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {ne ? 'लेख पृष्ठमा bookmark बटन थिचेपछि यहाँ देखिन्छ।' : 'Use the bookmark button on articles and they will appear here.'}
            </p>
          </div>
        )}
      </div>

      {stories.length ? (
        <button type="button" onClick={clearAll} className="mt-6 rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong">
          {ne ? 'सबै हटाउनुहोस्' : 'Clear saved list'}
        </button>
      ) : null}
    </section>
  )
}
