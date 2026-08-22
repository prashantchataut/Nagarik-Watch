'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localePrefix } from '@/lib/i18n/locales'
import {
  autocomplete,
  buildIndex,
  highlightSegments,
  search,
  type SearchableStory,
  type SearchResult,
} from '@/lib/search'
import { hasAnalyticsConsent } from '@/lib/reader/consent'
import { HubIndexHeader } from '@/components/HubIndexHeader'

type SearchViewProps = {
  locale: Locale
  corpus: SearchableStory[]
  /** Max stories indexed; disclosed in the UI when results may be incomplete. */
  corpusCap?: number
}

const DEBOUNCE_MS = 300
const RECENT_KEY = 'nw-recent-searches'
const RECENT_MAX = 6

/**
 * Client-side search surface. The corpus is pre-loaded server-side and passed in, so this only
 * owns the box: debounced input, URL (?q=) sync, the scorer/highlighter from lib/search, arrow
 * + Enter + Escape keyboard control, recent-search chips (sessionStorage), and the three empty
 * states (no query / no results / recents).
 */
export function SearchView({ locale, corpus, corpusCap }: SearchViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)

  const [archiveCorpus, setArchiveCorpus] = useState<SearchableStory[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveUnavailable, setArchiveUnavailable] = useState(false)
  const mergedCorpus = useMemo(() => {
    const byId = new Map<string, SearchableStory>()
    for (const story of [...corpus, ...archiveCorpus]) byId.set(String(story.id), story)
    return [...byId.values()]
  }, [archiveCorpus, corpus])
  const index = useMemo(() => buildIndex(mergedCorpus), [mergedCorpus])

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [debounced, setDebounced] = useState(searchParams.get('q') ?? '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [active, setActive] = useState(-1)
  const [recents, setRecents] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const lastTrackedSearch = useRef('')

  useEffect(() => {
    inputRef.current?.focus()
    try {
      const raw = sessionStorage.getItem(RECENT_KEY)
      if (raw) setRecents(JSON.parse(raw))
    } catch {
      // sessionStorage unavailable (private mode) — recents are a progressive enhancement.
    }
  }, [])

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecents((prev) => {
      const next = [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, RECENT_MAX)
      try {
        sessionStorage.setItem(RECENT_KEY, JSON.stringify(next))
      } catch {
        // ignore — recents are best-effort
      }
      return next
    })
  }, [])

  // Debounce: mirror the query into `debounced` and the URL after DEBOUNCE_MS of quiet.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query)
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set('q', query.trim())
        pushRecent(query)
      } else {
        params.delete('q')
      }
      const qs = params.toString()
      router.replace(qs ? `${prefix}/search?${qs}` : `${prefix}/search`, { scroll: false })
    }, DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query, searchParams, router, prefix, pushRecent])

  // Expand beyond the recent client corpus through the bounded server-side content source.
  useEffect(() => {
    const q = debounced.trim()
    if (q.length < 2) {
      setArchiveCorpus([])
      setArchiveUnavailable(false)
      return
    }
    const controller = new AbortController()
    setArchiveCorpus([])
    setArchiveLoading(true)
    setArchiveUnavailable(false)
    const params = new URLSearchParams({ q, locale })
    void fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Search service returned ${response.status}`)
        return (await response.json()) as { items?: SearchableStory[] }
      })
      .then((payload) => setArchiveCorpus(Array.isArray(payload.items) ? payload.items : []))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name === 'AbortError') return
        setArchiveCorpus([])
        setArchiveUnavailable(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setArchiveLoading(false)
      })
    return () => controller.abort()
  }, [debounced, locale])

  // Re-run the scorer whenever the debounced query changes.
  useEffect(() => {
    const next = search(index, debounced)
    setResults(next)
    setActive(next.length > 0 ? 0 : -1)
    const normalized = debounced.trim().toLocaleLowerCase()
    const trackingKey = `${locale}:${normalized}`
    if (
      normalized.length >= 2 &&
      trackingKey !== lastTrackedSearch.current &&
      hasAnalyticsConsent()
    ) {
      lastTrackedSearch.current = trackingKey
      void fetch('/api/search-events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: debounced, resultCount: next.length, locale }),
        keepalive: true,
      }).catch(() => undefined)
    }
  }, [index, debounced, locale])

  const suggestions = useMemo(() => {
    const q = query.trim()
    if (q.length < 2 || results.length > 0) return []
    return autocomplete(index, q, 6)
  }, [index, query, results.length])

  const clear = useCallback(() => {
    setQuery('')
    setDebounced('')
    setResults([])
    setActive(-1)
    inputRef.current?.focus()
  }, [])

  const hrefFor = useCallback(
    (r: SearchResult) => `${prefix}/${r.category.slug}/${r.slug}`,
    [prefix],
  )

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length === 0) return
      setActive((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length === 0) return
      setActive((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      if (results[active]) {
        e.preventDefault()
        router.push(hrefFor(results[active]))
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      clear()
    }
  }

  const hasQuery = debounced.trim().length > 0
  const titleFor = (r: SearchResult) => (locale === 'en' && r.titleEn ? r.titleEn : r.titleNe)
  const showRecents = !hasQuery && recents.length > 0
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader
        title={dict.searchHeading}
        lead={
          locale === 'en'
            ? 'Search titles, authors and topics in Nepali or English.'
            : 'शीर्षक, लेखक र विषय खोज्नुहोस्।'
        }
        lang={lang}
      />

      <div className="relative mt-8">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mute">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={dict.searchPlaceholder}
          aria-label={dict.searchAria}
          autoComplete="off"
          className="w-full border border-rule bg-surface-raised py-3 pl-12 pr-12 text-body-lg text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label={dict.searchClear}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-mute transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong"
          >
            <ClearIcon />
          </button>
        )}
      </div>

      {hasQuery && results.length > 0 && (
        <p className="mt-3 text-meta text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
          {dict.searchResults(results.length)}
          {archiveLoading
            ? locale === 'en'
              ? ' · checking the published archive…'
              : ' · प्रकाशित अभिलेख जाँचिँदै…'
            : archiveUnavailable
              ? locale === 'en'
                ? ' · archive search is temporarily unavailable; recent results remain available.'
                : ' · अभिलेख खोज अहिले उपलब्ध छैन; हालसालैका नतिजा भने देखाइएका छन्।'
              : corpusCap && corpus.length >= corpusCap
                ? locale === 'en'
                  ? ' · recent index plus matching archive results.'
                  : ' · हालसालैको सूचक र अभिलेखका मिल्ने नतिजा।'
                : ''}
        </p>
      )}

      {suggestions.length > 0 && (
        <section className="mt-6" aria-label={locale === 'en' ? 'Suggestions' : 'सुझावहरू'}>
          <h2 className="text-meta font-semibold text-ink-soft" lang={lang}>
            {locale === 'en' ? 'Suggestions' : 'सुझाव'}
          </h2>
          <ul className="mt-2 divide-y divide-rule border-y border-rule">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => setQuery(suggestion)}
                  className="block w-full py-3 text-left text-body font-semibold text-ink-soft transition hover:text-brand-strong"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Results */}
      {hasQuery && results.length > 0 && (
        <ul
          ref={listRef}
          className="mt-4 divide-y divide-rule border-y border-rule"
          role="listbox"
          aria-label={dict.searchHeading}
        >
          {results.map((r, i) => {
            const title = titleFor(r)
            const segs = highlightSegments(title, debounced)
            const isActive = i === active
            const deck = locale === 'en' && r.deckEn ? r.deckEn : r.deckNe
            const thumbIsDataUrl = r.heroImage?.url.startsWith('data:') ?? false
            return (
              <li key={`${r.id}-${r.slug}`} role="option" aria-selected={isActive}>
                <Link
                  href={hrefFor(r)}
                  className={`flex gap-3 px-0 py-4 transition-colors duration-fast ease-out-quint ${
                    isActive ? 'bg-brand-tint/55' : 'hover:bg-brand-tint/35'
                  }`}
                >
                  <div className="relative mt-0.5 hidden aspect-[4/3] w-24 shrink-0 overflow-hidden bg-brand-tint sm:block">
                    {r.heroImage ? (
                      <Image
                        src={r.heroImage.url}
                        alt=""
                        fill
                        unoptimized={thumbIsDataUrl}
                        sizes="96px"
                        className="object-cover"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="absolute inset-0 grid place-items-center text-caption font-bold text-mute"
                        aria-hidden="true"
                      >
                        NW
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 px-3 sm:px-0">
                    <span className="text-caption font-semibold text-mute">{r.categoryLabel}</span>
                    <span
                      className="mt-1 block font-display text-h3 text-ink"
                      lang={locale === 'en' && r.titleEn ? 'en' : 'ne'}
                    >
                      {segs.map((s, idx) =>
                        s.match ? (
                          <mark key={idx} className="bg-transparent font-bold text-brand-strong">
                            {s.text}
                          </mark>
                        ) : (
                          <span key={idx}>{s.text}</span>
                        ),
                      )}
                    </span>
                    {deck ? (
                      <span
                        className="mt-1 block line-clamp-2 text-body text-ink-soft"
                        lang={locale === 'en' && r.deckEn ? 'en' : 'ne'}
                      >
                        {deck}
                      </span>
                    ) : null}
                    {r.authors.length > 0 ? (
                      <span className="mt-1.5 block text-meta text-ink-soft">
                        {r.authors.map((a) => a.name).join(' · ')}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {/* Empty: query but no results */}
      {hasQuery && results.length === 0 && (
        <div className="mt-10 border-y border-rule bg-brand-tint/35 px-4 py-10" lang={lang}>
          <p className="font-display text-h2 text-ink">{dict.searchNoResults}</p>
          <p className="mt-2 max-w-body text-body text-ink-soft">{dict.searchNoResultsHint}</p>
        </div>
      )}

      {showRecents && (
        <section className="mt-8">
          <h2 className="font-display text-h2 text-ink" lang={lang}>
            {dict.searchRecent}
          </h2>
          <ul className="mt-3 divide-y divide-rule border-y border-rule">
            {recents.map((r) => (
              <li key={r}>
                <button
                  type="button"
                  onClick={() => setQuery(r)}
                  className="block w-full py-3 text-left text-body font-semibold text-ink-soft transition hover:text-brand-strong"
                >
                  {r}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasQuery && recents.length === 0 && (
        <div className="mt-10 border-y border-rule bg-brand-tint/35 px-4 py-10" lang={lang}>
          <p className="font-display text-h2 text-ink">{dict.searchEmptyQuery}</p>
          <p className="mt-2 max-w-body text-body text-ink-soft">{dict.searchEmptyHint}</p>
        </div>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
