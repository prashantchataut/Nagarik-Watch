'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import type { Author, Category, Locale, Tag } from '@nagarikwatch/db'
import Link from 'next/link'
import { getOrCreateReaderId } from '@/lib/reader/consent'
import {
  READER_PREFERENCES_EVENT,
  readLocalReaderPreferences,
  writeLocalReaderPreferences,
} from '@/lib/reader/preferences'
import type { ReaderPreferences } from '@/lib/reader/preferences-store'

type Props = {
  locale: Locale
  categories: Category[]
  tags: Tag[]
  authors: Author[]
}

const fallback: ReaderPreferences = {
  categories: [],
  tags: [],
  authors: [],
  provinces: [],
  breaking: true,
  followedTopics: true,
  followedAuthors: true,
  dailyDigest: false,
  browserAlerts: false,
  quietStart: 22,
  quietEnd: 7,
  timeZone: 'Asia/Kathmandu',
  updatedAt: new Date(0).toISOString(),
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function ReaderPreferencePanel({ locale, categories, tags, authors }: Props) {
  const english = locale === 'en'
  const [preferences, setPreferences] = useState<ReaderPreferences>(fallback)
  const [active, setActive] = useState<'categories' | 'tags' | 'authors'>('categories')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'loading' | 'saved' | 'device' | 'saving'>('loading')
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const local = readLocalReaderPreferences()
    if (local) setPreferences(local)
    const fp = getOrCreateReaderId()
    fetch(`/api/preferences?fingerprint=${encodeURIComponent(fp)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preference request failed: ${response.status}`)
        return response.json() as Promise<{ preferences: ReaderPreferences }>
      })
      .then((body) => {
        if (cancelled) return
        setPreferences(body.preferences)
        writeLocalReaderPreferences(body.preferences)
        setStatus('saved')
      })
      .catch(() => {
        if (!cancelled) setStatus(local ? 'device' : 'saved')
      })
    return () => { cancelled = true }
  }, [])

  const options = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(english ? 'en' : 'ne')
    const source = active === 'categories'
      ? categories.map((item) => ({ slug: item.slug, label: english ? item.nameEn || item.nameNe : item.nameNe }))
      : active === 'tags'
        ? tags.map((item) => ({ slug: item.slug, label: english ? item.nameEn || item.nameNe : item.nameNe }))
        : authors.filter((item) => item.isActive).map((item) => ({ slug: item.slug, label: item.name }))
    return source.filter((item) => !needle || item.label.toLocaleLowerCase(english ? 'en' : 'ne').includes(needle) || item.slug.includes(needle))
  }, [active, authors, categories, english, query, tags])

  function update(next: ReaderPreferences) {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (browserTimeZone) next = { ...next, timeZone: browserTimeZone }
    setPreferences(next)
    writeLocalReaderPreferences(next)
    setStatus('saving')
    startTransition(async () => {
      try {
        const response = await fetch('/api/preferences', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fingerprint: getOrCreateReaderId(), ...next }),
        })
        if (!response.ok) throw new Error(`Preference save failed: ${response.status}`)
        const body = await response.json() as { preferences: ReaderPreferences }
        setPreferences(body.preferences)
        writeLocalReaderPreferences(body.preferences)
        setStatus('saved')
      } catch {
        setStatus('device')
      }
    })
  }

  const selected = active === 'categories' ? preferences.categories : active === 'tags' ? preferences.tags : preferences.authors

  function resetPreferences() {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || preferences.timeZone || 'Asia/Kathmandu'
    update({ ...fallback, timeZone, updatedAt: new Date().toISOString() })
    setQuery('')
    setActive('categories')
  }

  function moveTab(current: typeof active, direction: -1 | 1) {
    const order: Array<typeof active> = ['categories', 'tags', 'authors']
    const next = order[(order.indexOf(current) + direction + order.length) % order.length]
    if (!next) return
    setActive(next)
    window.requestAnimationFrame(() => document.getElementById(`reader-interest-${next}`)?.focus())
  }

  return (
    <section className="preference-desk" aria-labelledby="preference-desk-title">
      <header className="preference-desk__header">
        <div>
          <p className="editorial-kicker" lang="en">Personal desk</p>
          <h2 id="preference-desk-title">{english ? 'Choose what deserves your attention' : 'तपाईंले पछ्याउन चाहेको विषय छान्नुहोस्'}</h2>
          <p>{english ? 'These choices tune recommendations and notification eligibility. They never override editorial prominence or public-interest breaking news.' : 'यी छनोटले सिफारिस र सूचनालाई मिलाउँछन्। सम्पादकीय प्राथमिकता र सार्वजनिक महत्त्वका ब्रेकिङ समाचारलाई यसले विस्थापित गर्दैन।'}</p>
        </div>
        <span role="status" className="preference-desk__status" data-state={status}>
          {status === 'loading' ? (english ? 'Loading' : 'लोड हुँदै') : status === 'saving' || pending ? (english ? 'Saving' : 'सुरक्षित हुँदै') : status === 'saved' ? (english ? 'Synced' : 'सिङ्क भयो') : (english ? 'Saved on device' : 'उपकरणमा सुरक्षित')}
        </span>
      </header>

      <div className="preference-desk__alerts">
        <label><input type="checkbox" checked={preferences.breaking} onChange={(event) => update({ ...preferences, breaking: event.target.checked })} /><span><strong>{english ? 'Breaking news' : 'ब्रेकिङ समाचार'}</strong><small>{english ? 'Only verified, high-priority alerts.' : 'प्रमाणित र उच्च प्राथमिकताका सूचना मात्र।'}</small></span></label>
        <label><input type="checkbox" checked={preferences.followedTopics} onChange={(event) => update({ ...preferences, followedTopics: event.target.checked })} /><span><strong>{english ? 'Followed desks and topics' : 'पछ्याइएका विभाग र विषय'}</strong><small>{english ? 'Updates matching your selected categories and tags.' : 'तपाईंले छानेका विभाग र ट्यागसँग मिल्ने अपडेट।'}</small></span></label>
        <label><input type="checkbox" checked={preferences.followedAuthors} onChange={(event) => update({ ...preferences, followedAuthors: event.target.checked })} /><span><strong>{english ? 'Followed journalists' : 'पछ्याइएका पत्रकार'}</strong><small>{english ? 'New work from selected bylines.' : 'छानिएका पत्रकारका नयाँ सामग्री।'}</small></span></label>
        <label><input type="checkbox" checked={preferences.dailyDigest} onChange={(event) => update({ ...preferences, dailyDigest: event.target.checked })} /><span><strong>{english ? 'Daily briefing' : 'दैनिक समाचार सार'}</strong><small>{english ? 'A compact briefing when no urgent alert qualifies.' : 'तत्काल सूचना योग्य नभए दिनको संक्षिप्त समाचार सार।'}</small></span></label>
      </div>

      <div className="preference-desk__schedule">
        <div><strong>{english ? 'Quiet hours' : 'शान्त समय'}</strong><small>{english ? `Non-breaking alerts are held in ${preferences.timeZone || 'your local timezone'}.` : `${preferences.timeZone || 'स्थानीय समय क्षेत्र'} अनुसार गैर-ब्रेकिङ सूचना रोकिएर बस्छन्।`}</small></div>
        <label><span>{english ? 'From' : 'सुरु'}</span><select value={preferences.quietStart ?? ''} onChange={(event) => update({ ...preferences, quietStart: event.target.value === '' ? null : Number(event.target.value) })}><option value="">{english ? 'Off' : 'बन्द'}</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label>
        <label><span>{english ? 'Until' : 'अन्त्य'}</span><select value={preferences.quietEnd ?? ''} onChange={(event) => update({ ...preferences, quietEnd: event.target.value === '' ? null : Number(event.target.value) })}><option value="">{english ? 'Off' : 'बन्द'}</option>{Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}</select></label>
      </div>

      <div className="preference-desk__picker">
        <div className="preference-desk__tabs" role="tablist" aria-label={english ? 'Interest type' : 'रुचिको प्रकार'}>
          {(['categories', 'tags', 'authors'] as const).map((key) => (
            <button key={key} id={`reader-interest-${key}`} type="button" role="tab" tabIndex={active === key ? 0 : -1} aria-selected={active === key} aria-controls="reader-interest-panel" onClick={() => setActive(key)} onKeyDown={(event) => { if (event.key === 'ArrowLeft') { event.preventDefault(); moveTab(key, -1) } if (event.key === 'ArrowRight') { event.preventDefault(); moveTab(key, 1) } }}>
              {key === 'categories' ? (english ? 'Desks' : 'विभाग') : key === 'tags' ? (english ? 'Topics' : 'विषय') : (english ? 'Journalists' : 'पत्रकार')}
            </button>
          ))}
        </div>
        <div id="reader-interest-panel" role="tabpanel" aria-labelledby={`reader-interest-${active}`}>
        <input aria-label={active === 'authors' ? (english ? 'Search journalists' : 'पत्रकार खोज्नुहोस्') : active === 'tags' ? (english ? 'Search topics' : 'विषय खोज्नुहोस्') : (english ? 'Search desks' : 'विभाग खोज्नुहोस्')} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={active === 'authors' ? (english ? 'Search by name' : 'नामबाट खोज्नुहोस्') : active === 'tags' ? (english ? 'Search topics' : 'विषय खोज्नुहोस्') : (english ? 'Search desks' : 'विभाग खोज्नुहोस्')} />
        <div className="preference-desk__options">
          {options.slice(0, active === 'authors' ? 30 : 24).map((item) => (
            <label key={item.slug} data-selected={selected.includes(item.slug)}>
              <input
                type="checkbox"
                checked={selected.includes(item.slug)}
                onChange={() => update({
                  ...preferences,
                  [active]: toggle(selected, item.slug),
                })}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        </div>
      </div>
      <div className="preference-desk__footer">
      <p className="preference-desk__note">
        {english ? `${preferences.categories.length + preferences.tags.length + preferences.authors.length} interests selected. Recommendation version: nw-hybrid-v2.` : `${preferences.categories.length + preferences.tags.length + preferences.authors.length} रुचि छानिएका छन्। सिफारिस संस्करण: nw-hybrid-v2।`}{' '}
        <Link href={`${english ? '/en' : ''}/how-recommendations-work`}>{english ? 'See the ranking rules.' : 'क्रमका नियम हेर्नुहोस्।'}</Link>
      </p>
      <button type="button" onClick={resetPreferences} disabled={pending} className="text-action preference-desk__reset">{english ? 'Reset interests and alerts' : 'रुचि र सूचना रिसेट गर्नुहोस्'}</button>
      </div>
    </section>
  )
}
