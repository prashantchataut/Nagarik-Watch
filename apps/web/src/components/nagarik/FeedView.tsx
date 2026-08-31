'use client'

/**
 * सबै समाचार (All-news feed) — infinite-scroll feed merging the static
 * archive + live CMS articles, with desk filter chips, view counts and
 * save buttons. Also the personalization surface: "तपाईंका लागि" rail.
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Eye } from 'lucide-react'
import { container, PageHead } from './PatroView'
import { Kicker, SectionHeader } from './cards'
import { stories, desks, type Story } from '@/lib/news/data'
import { useDbArticles, dbArticleToStory } from '@/lib/news/article-store'
import { href, go } from '@/lib/news/router'
import { useReadHistory } from '@/lib/news/read-history'
import { recommendFor, reasonFor } from '@/lib/news/recommend'
import { useSaved } from '@/lib/news/storage'
import { formatDevanagariCount } from '@/lib/news/ad-store'
import { toDevanagari } from '@/lib/news/patro'
import { AdSlot } from './monetize'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useTrendingMap } from '@/lib/news/trending-store'

const PAGE = 12

export default function FeedView() {
  const [visible, setVisible] = useState(PAGE)
  const [filter, setFilter] = useState<string>('all')
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
  const [query, setQuery] = useState('')
  const { dbArticles } = useDbArticles()
  const history = useReadHistory()
  const trending = useTrendingMap()
  const { saved, toggle } = useSaved()

  const all = useMemo<Story[]>(() => {
    const cms = dbArticles.map((a) => dbArticleToStory(a))
    return [...stories, ...cms].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  }, [dbArticles])

  const filtered = useMemo(() => {
    let list = all
    if (filter !== 'all') list = list.filter((s) => s.desk === filter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((s) =>
        [s.titleNe, s.titleEn, s.deckNe, s.author, ...s.tags].join(' ').toLowerCase().includes(q),
      )
    }
    return list
  }, [all, filter, query])

  const shown = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  // Batch view-count fetch for the visible slice.
  useEffect(() => {
    if (shown.length === 0) return
    const keys = shown.map((s) => `${s.desk}/${s.slug}`).slice(0, 40)
    const param = keys.join(',')
    let cancelled = false
    void fetch(`/api/views?keys=${encodeURIComponent(param)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { views?: Record<string, number> } | null) => {
        if (!cancelled && data?.views) setViewCounts((prev) => ({ ...prev, ...data.views! }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [shown.length, filter, query])  

  // Infinite scroll sentinel.
  useEffect(() => {
    if (!hasMore) return
    const el = document.getElementById('feed-sentinel')
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + PAGE, filtered.length))
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, filtered.length])

  const personal = useMemo(
    () => recommendFor(all, { history, trending, limit: 4 }),
    [all, history, trending],
  )

  const activeDesks = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of all) counts.set(s.desk, (counts.get(s.desk) ?? 0) + 1)
    return desks.filter((d) => (counts.get(d.slug) ?? 0) > 0)
  }, [all])

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="फिड"
          title="सबै समाचार"
          sub="स्थिर संग्रह र सम्पादकीय टोलीका ताजा कथा एकै धारमा — डेस्क फिल्टर, पढाइ-गणना र अनन्त स्क्रोलसहित।"
        />

        {/* Personalized rail */}
        {personal.length > 0 && (
          <section className="mt-6 rounded-md border border-crimson/40 bg-crimson/5 p-5">
            <h3 className="font-headline text-[17px] font-bold text-ink">तपाईंका लागि</h3>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              तपाईंको पढाइको इतिहासबाट सिफारिस — सूत्र खुला छ: डेस्क-रुचि + विषय-मिलान + ताजा + चर्चित। यन्तरमा मात्र गणना।
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {personal.map((s) => (
                <a key={s.slug} href={href(`/${s.desk}/${s.slug}`)} className="group block">
                  <Kicker desk={s.desk} />
                  <h4 className="mt-1 font-headline text-[15.5px] font-bold leading-snug text-ink group-hover:text-crimson">
                    {s.titleNe}
                  </h4>
                  <p className="mt-1 text-[11.5px] text-ink-faint">{reasonFor(s, history, trending)}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Search + desk chips */}
        <div className="sticky top-[46px] z-30 -mx-4 mt-8 border-y border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:top-[52px]">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setVisible(PAGE)
              }}
              placeholder="फिडमा खोज्नुहोस्…"
              aria-label="फिडमा खोज्नुहोस्"
              className="mr-2 w-full max-w-xs rounded-sm border border-rule bg-surface px-3 py-1.5 text-[13.5px] text-ink focus:border-crimson focus:outline-none"
            />
            <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="डेस्क फिल्टर">
              <button
                type="button"
                role="tab"
                aria-selected={filter === 'all'}
                onClick={() => {
                  setFilter('all')
                  setVisible(PAGE)
                }}
                className={`shrink-0 rounded-full border px-3 py-1 font-headline text-[12.5px] font-bold ${
                  filter === 'all' ? 'border-crimson bg-crimson text-white' : 'border-rule text-ink-soft hover:border-rule-strong'
                }`}
              >
                सबै ({toDevanagari(all.length)})
              </button>
              {activeDesks.map((d) => (
                <button
                  key={d.slug}
                  type="button"
                  role="tab"
                  aria-selected={filter === d.slug}
                  onClick={() => {
                    setFilter(d.slug)
                    setVisible(PAGE)
                  }}
                  className={`shrink-0 rounded-full border px-3 py-1 font-headline text-[12.5px] font-bold ${
                    filter === d.slug
                      ? 'border-crimson bg-crimson text-white'
                      : 'border-rule text-ink-soft hover:border-rule-strong'
                  }`}
                >
                  {d.nameNe}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="divide-y divide-rule">
          {shown.length === 0 ? (
            <p className="py-14 text-center text-[14px] text-ink-faint">केही भेटिएन — फिल्टर/खोज जाँच्नुहोस्।</p>
          ) : (
            shown.map((s, i) => {
              const key = `${s.desk}/${s.slug}`
              const views = viewCounts[key] ?? 0
              const isSaved = saved.includes(s.slug)
              return (
                <div key={`${s.desk}-${s.slug}`}>
                  <article className="group flex gap-4 py-5">
                    <a href={href(`/${s.desk}/${s.slug}`)} className="min-w-0 flex-1">
                      <Kicker desk={s.desk} />
                      <h2 className="mt-1 font-headline text-[18px] font-extrabold leading-snug text-ink group-hover:text-crimson sm:text-[20px]">
                        {s.titleNe}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">{s.deckNe}</p>
                      <p className="mt-2 text-[11.5px] text-ink-faint">
                        {s.author} · {s.location}
                        {views > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <Eye className="size-3" aria-hidden /> {formatDevanagariCount(views)} पटक
                          </span>
                        )}
                      </p>
                    </a>
                    <a
                      href={href(`/${s.desk}/${s.slug}`)}
                      className="hidden shrink-0 sm:block"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      { }
                      <img
                        src={s.hero}
                        alt=""
                        className="h-24 w-36 rounded object-cover"
                        loading="lazy"
                      />
                    </a>
                    <button
                      type="button"
                      aria-label={isSaved ? 'सेभबाट हटाउनुहोस्' : 'सेभ गर्नुहोस्'}
                      onClick={() => void toggle(s.slug)}
                      className="mt-1 h-9 w-9 shrink-0 text-ink-faint hover:text-crimson"
                    >
                      {isSaved ? <BookmarkCheck className="size-5 text-crimson" /> : <Bookmark className="size-5" />}
                    </button>
                  </article>

                  {/* In-feed ad every 9 items */}
                  {i > 0 && (i + 1) % 9 === 0 && (
                    <div className="py-4">
                      <AdSlot placement="infeed" />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Sentinel */}
        {hasMore && (
          <div id="feed-sentinel" className="flex items-center justify-center gap-2 py-8 text-ink-faint">
            <Loader2 className="size-4 animate-spin" aria-hidden /> थप लोड हुँदै…
          </div>
        )}
        {!hasMore && filtered.length > PAGE && (
          <p className="py-8 text-center text-[12.5px] text-ink-faint">
            {toDevanagari(filtered.length)} कथाको अन्त्य सम्पन्न
          </p>
        )}

        <SectionHeader title="डेस्क हेर्नुहोस्" />
        <div className="grid grid-cols-2 gap-3 pb-16 sm:grid-cols-3 lg:grid-cols-6">
          {activeDesks.map((d) => (
            <a
              key={d.slug}
              href={href(`/${d.slug}`)}
              className="rounded-md border border-rule bg-paper p-3 text-center font-headline text-[14px] font-bold text-ink hover:border-crimson hover:text-crimson"
            >
              {d.nameNe}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
