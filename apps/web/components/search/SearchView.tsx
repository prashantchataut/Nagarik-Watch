'use client'

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
export function SearchView({ locale, corpus }: SearchViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)

  const index = useMemo(() => buildIndex(corpus), [corpus])

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
        kicker={locale === 'en' ? 'Archive search' : 'अभिलेख खोज'}
        title={dict.searchHeading}
        lead={
          locale === 'en'
            ? 'Search published titles, authors and topics. Devanagari and English both work.'
            : 'प्रकाशित शीर्षक, लेखक र विषय खोज्नुहोस्। देवनागरी र अंग्रेजी दुवै चल्छ।'
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
          className="w-full rounded-md border border-rule bg-surface-raised py-3 pl-12 pr-12 text-body-lg text-ink shadow-card placeholder:text-mute focus:border-brand"
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
        </p>
      )}

      {suggestions.length > 0 && (
        <ul className="mt-4 divide-y divide-rule border-y border-rule" aria-label={locale === 'en' ? 'Suggestions' : 'सुझावहरू'}>
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
      )}

      {/* Results */}
      {hasQuery && results.length > 0 && (
        <ul ref={listRef} className="mt-4 space-y-1" role="listbox" aria-label={dict.searchHeading}>
          {results.map((r, i) => {
            const title = titleFor(r)
            const segs = highlightSegments(title, debounced)
            const isActive = i === active
            return (
              <li key={`${r.id}-${r.slug}`} role="option" aria-selected={isActive}>
                <Link
                  href={hrefFor(r)}
                  className={`flex flex-col gap-1 rounded-md px-3 py-3 transition-colors duration-fast ease-out-quint ${
                    isActive ? 'bg-brand-tint' : 'hover:bg-brand-tint/60'
                  }`}
                >
                  <span
                    className="font-display text-h3 text-ink"
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
                  {r.authors.length > 0 && (
                    <span className="text-meta text-ink-soft">
                      {r.authors.map((a) => a.name).join(' · ')}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {/* Empty: query but no results */}
      {hasQuery && results.length === 0 && (
        <div className="mt-10 border-y border-rule py-10" lang={lang}>
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
        <div className="mt-10 border-y border-rule py-10" lang={lang}>
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
