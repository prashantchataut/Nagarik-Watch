'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookmarkX, Search as SearchIcon } from 'lucide-react'
import { stories } from '@/lib/news/data'
import { searchStories, storyUrl } from '@/lib/news/utils'
import { useSaved } from '@/lib/news/storage'
import { toDevanagari } from '@/lib/news/patro'
import { href, go } from '@/lib/news/router'
import { PageHead, container } from './PatroView'
import { HeroImage, Kicker, MetaLine } from './cards'

/* ------------------------------- Saved ----------------------------------- */

export function SavedView() {
  const { saved, ready } = useSaved()
  const items = useMemo(
    () =>
      saved
        .map((slug) => stories.find((s) => s.slug === slug))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [saved],
  )

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="पाठक"
          title="सेभ गरिएका समाचार"
          sub="तपाईंले सेभ गर्नुभएका समाचारहरू। यी यही यन्त्रमा मात्र राखिन्छन् — खाता नलिइकन अर्को यन्त्रमा सर्दैनन्, र सर्भरमा पठाइँदैनन्।"
        />

        {!ready ? (
          <div className="py-16 text-center text-ink-faint">लोड हुँदै…</div>
        ) : items.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <BookmarkX className="mx-auto size-12 text-ink-faint" strokeWidth={1.5} />
            <h2 className="mt-4 font-headline text-[22px] font-extrabold text-ink">
              अझै केही सेभ गरिएको छैन
            </h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              कुनै पनि समाचार खोलेर माथि “सेभ गर्नुहोस्” थिच्नुभयो भने त्यो यहाँ जम्मा हुन्छ।
            </p>
            <a
              href={href('/')}
              className="mt-5 inline-flex rounded-sm bg-crimson px-5 py-2.5 font-headline text-[15px] font-bold text-white"
            >
              समाचार हेर्न सुरु गर्नुहोस्
            </a>
          </div>
        ) : (
          <>
            <p className="pt-6 text-[13.5px] text-ink-faint">
              जम्मा {toDevanagari(items.length)} समाचार · यो यन्त्रमा मात्र
            </p>
            <div className="grid gap-x-6 gap-y-7 py-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <article key={s.slug} className="group">
                  <Kicker desk={s.desk} />
                  <a href={storyUrl(s)} className="block">
                    <div className="mt-1.5">
                      <HeroImage story={s} ratio="aspect-[16/9]" rounded="rounded-sm" sizes="(max-width: 640px) 100vw, 33vw" />
                      <h3 className="headline-card mt-2 text-[17px] text-ink group-hover:text-crimson transition-colors">
                        {s.titleNe}
                      </h3>
                      <MetaLine story={s} />
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

/* ------------------------------- Search ---------------------------------- */

export function SearchView({
  initialQuery = '',
  onNavigate,
}: {
  initialQuery?: string
  onNavigate?: () => void
}) {
  const [query, setQuery] = useState(initialQuery)
  const [submitted, setSubmitted] = useState(initialQuery)
  const results = useMemo(() => searchStories(submitted), [submitted])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(initialQuery)
      setSubmitted(initialQuery)
    }, 0)
    return () => window.clearTimeout(t)
  }, [initialQuery])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(query)
  }

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="खोज"
          title="समाचार खोज्नुहोस्"
          sub="८७ वटा समाचारको पूरै संग्रहमा शीर्षक, विवरण, लेखक र स्थानले खोज्नुहोस्।"
        />

        <form onSubmit={submit} className="flex max-w-2xl gap-2 py-7" role="search">
          <label htmlFor="search-input" className="sr-only">
            खोजी शब्द
          </label>
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
            <input
              id="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="जस्तै: बजेट, क्रिकेट, पोखरा, नेप्से…"
              className="w-full rounded-sm border border-rule bg-surface py-3 pl-11 pr-4 text-[16.5px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="rounded-sm bg-crimson px-6 font-headline text-[16px] font-bold text-white transition-transform hover:-translate-y-px"
          >
            खोज्नुहोस्
          </button>
        </form>

        {submitted && (
          <p className="mb-5 text-[14px] text-ink-soft">
            “<span className="font-semibold text-ink">{submitted}</span>” का लागि{' '}
            <span className="font-headline font-bold text-crimson">
              {toDevanagari(results.length)}
            </span>{' '}
            नतिजा भेटियो
          </p>
        )}

        {submitted && results.length === 0 && (
          <div className="max-w-md py-10 text-[15px] leading-relaxed text-ink-soft">
            कुनै समाचार भेटिएन। फरक शब्दले प्रयास गर्नुहोस् — जस्तै “बजेट”, “चुनाव”, “मनसुन”, “रेमिट्यान्स”।
          </div>
        )}

        <div className="grid gap-x-8 gap-y-0 pb-10 lg:grid-cols-2">
          {results.map((s) => (
            <article key={s.slug} className="group flex gap-4 border-b border-rule py-4">
              <div className="min-w-0 flex-1">
                <Kicker desk={s.desk} />
                <a
                  href={storyUrl(s)}
                  onClick={() => onNavigate?.()}
                  className="block"
                >
                  <h3 className="headline-card mt-1 text-[17px] leading-snug text-ink group-hover:text-crimson transition-colors">
                    {s.titleNe}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">
                    {s.deckNe}
                  </p>
                  <MetaLine story={s} />
                </a>
              </div>
              <a
                href={storyUrl(s)}
                onClick={() => onNavigate?.()}
                className="hidden shrink-0 sm:block"
                tabIndex={-1}
                aria-hidden="true"
              >
                <HeroImage story={s} ratio="aspect-square size-[96px]" rounded="rounded-sm" sizes="96px" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}

/** Search overlay launched from the masthead. Content remounts fresh on open. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <SearchOverlayInner onClose={onClose} />
}

function SearchOverlayInner({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => (query.trim() ? searchStories(query).slice(0, 6) : []), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 no-print" role="dialog" aria-modal="true" aria-label="खोज">
      <button
        type="button"
        aria-label="बन्द गर्नुहोस्"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-0 border-b border-rule bg-paper p-4 shadow-2xl md:p-6">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (query.trim()) {
                onClose()
                go(`/search/${encodeURIComponent(query.trim())}`)
              }
            }}
            className="relative"
          >
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="के खोज्नुहुन्छ? शीर्षक, विषय, स्थान…"
              className="w-full rounded-sm border border-rule bg-surface py-3.5 pl-12 pr-4 text-[17px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none"
              autoFocus
            />
          </form>
          {results.length > 0 && (
            <ul className="mt-3 divide-y divide-rule">
              {results.map((s) => (
                <li key={s.slug}>
                  <a
                    href={storyUrl(s)}
                    onClick={onClose}
                    className="flex items-baseline justify-between gap-4 py-2.5 hover:bg-surface-soft"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-headline text-[15.5px] font-semibold text-ink">
                        {s.titleNe}
                      </span>
                      <span className="block text-[12px] text-ink-faint">{s.author}</span>
                    </span>
                    <span className="shrink-0 text-[12px] font-bold uppercase text-crimson">
                      खोल्नुहोस् →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-center text-[12px] text-ink-faint">
            Enter थिचेर पूरा खोज पानोमा जानुहोस् · Esc ले बन्द गर्छ
          </p>
        </div>
      </div>
    </div>
  )
}
