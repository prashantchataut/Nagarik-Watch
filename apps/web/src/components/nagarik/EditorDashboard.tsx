'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Check,
  Download,
  EyeOff,
  Loader2,
  Megaphone,
  MessageSquare,
  Newspaper,
  Trash2,
  X,
} from 'lucide-react'
import { desks, type Block } from '@/lib/news/data'
import { toDevanagari } from '@/lib/news/patro'
import { blocksFromJson } from '@/lib/blocks'
import { apiDelete, apiGet, apiPatch, apiPut } from '@/lib/news/api-client'
import { refreshArticles } from '@/lib/news/article-store'
import { LaunchCheckPanel, AdsManagerPanel } from './EditorExtras'

/**
 * सम्पादक डेस्क (editor-only dashboard): review queue, pitch triage,
 * breaking-news control, newsroom analytics and comment moderation.
 */

interface QueueArticle {
  slug: string
  desk: string
  titleNe: string
  deckNe: string
  bodyNe: string
  hero: string | null
  authorName: string
  updatedAt: string
}

interface QueuePitch {
  id: string
  headline: string
  desk: string
  summary: string
  status: string
  journalistName: string
  createdAt: string
}

interface QueueComment {
  id: string
  storyKey: string
  body: string
  authorName: string
  createdAt: string
}

interface QueueData {
  articles: QueueArticle[]
  pitches: QueuePitch[]
  comments: QueueComment[]
  counts: { drafts: number; submitted: number; published: number; openPitches: number; comments: number }
}

interface Analytics {
  traffic: { today: number; week: number; daily: { day: string; views: number }[] }
  topStories: { storyKey: string; views: number; title: string | null; desk: string }[]
  pipeline: Record<string, number>
  audience: {
    readers: number
    subscribers: number
    journalists: number
    commentsVisible: number
    commentsHidden: number
  }
  recentSubscribers: { email: string; createdAt: string }[]
}

interface Breaking {
  id: string
  textNe: string
  link: string | null
  at: string
}

function StatCard({ label, value, tone = 'ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="paper-card rounded-sm p-4">
      <p className={`font-headline text-[26px] font-extrabold leading-none ${tone}`}>{value}</p>
      <p className="mt-1.5 text-[12px] font-semibold uppercase text-ink-faint">{label}</p>
    </div>
  )
}

function BlocksPreview({ raw }: { raw: string }) {
  const blocks = useMemo(() => blocksFromJson(raw) as Block[], [raw])
  return (
    <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto border-t border-rule pt-3 text-[14px] leading-[1.8] text-ink">
      {blocks.map((b, i) => {
        if (b.k === 'h2')
          return (
            <h4 key={i} className="font-headline text-[16px] font-extrabold text-ink">
              {b.text}
            </h4>
          )
        if (b.k === 'h3')
          return (
            <h5 key={i} className="font-headline text-[15px] font-bold text-ink">
              {b.text}
            </h5>
          )
        if (b.k === 'quote')
          return (
            <blockquote key={i} className="border-l-[3px] border-crimson/60 pl-3 italic text-ink-soft">
              “{b.text}”
            </blockquote>
          )
        if (b.k === 'list')
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-crimson">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          )
        return <p key={i}>{b.text}</p>
      })}
    </div>
  )
}

export default function EditorDashboard({ onPublished }: { onPublished: () => void }) {
  const [queue, setQueue] = useState<QueueData | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [breaking, setBreaking] = useState<Breaking | null>(null)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [note, setNote] = useState<Record<string, string>>({})
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [breakingText, setBreakingText] = useState('')
  const [breakingLink, setBreakingLink] = useState('')
  const [breakingBusy, setBreakingBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [q, a, b] = await Promise.all([
        apiGet<QueueData & { ok: boolean }>('/api/editor/queue'),
        apiGet<Analytics & { ok: boolean }>('/api/editor/analytics'),
        apiGet<{ breaking: Breaking | null }>('/api/breaking'),
      ])
      setQueue(q)
      setAnalytics(a)
      setBreaking(b.breaking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'डेस्क लोड गर्न सकिएन।')
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(load, 0)
    return () => window.clearTimeout(t)
  }, [load])

  const reviewArticle = async (slug: string, action: 'publish' | 'decline') => {
    setBusySlug(slug)
    setError(null)
    try {
      await apiPatch(`/api/articles/${slug}`, {
        action,
        ...(note[slug] ? { editorNote: note[slug] } : {}),
      })
      await load()
      await refreshArticles(true)
      onPublished()
      setExpanded((e) => (e === slug ? null : e))
      setNote((n) => ({ ...n, [slug]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'कार्य असफल।')
    } finally {
      setBusySlug(null)
    }
  }

  const reviewPitch = async (id: string, status: 'in_review' | 'accepted' | 'declined') => {
    setBusySlug(id)
    setError(null)
    try {
      await apiPatch(`/api/editor/pitches/${id}`, {
        status,
        ...(note[id] ? { editorNote: note[id] } : {}),
      })
      await load()
      setNote((n) => ({ ...n, [id]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'कार्य असफल।')
    } finally {
      setBusySlug(null)
    }
  }

  const moderateComment = async (id: string, action: 'hide' | 'delete') => {
    setBusySlug(id)
    try {
      if (action === 'hide') {
        await apiPatch(`/api/comments/${id}`, { status: 'hidden' })
      } else {
        await apiDelete(`/api/comments/${id}`)
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'कार्य असफल।')
    } finally {
      setBusySlug(null)
    }
  }

  const saveBreaking = async () => {
    setBreakingBusy(true)
    setError(null)
    try {
      await apiPut('/api/editor/breaking', { textNe: breakingText, link: breakingLink })
      setBreakingText('')
      setBreakingLink('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'तत्काल समाचार राख्न सकिएन।')
    } finally {
      setBreakingBusy(false)
    }
  }

  const clearBreaking = async () => {
    setBreakingBusy(true)
    try {
      await apiDelete('/api/editor/breaking')
      await load()
    } finally {
      setBreakingBusy(false)
    }
  }

  const maxDaily = analytics ? Math.max(1, ...analytics.traffic.daily.map((d) => d.views)) : 1

  if (queue === null || analytics === null) {
    return (
      <div className="flex items-center gap-2 py-16 text-[14px] text-ink-faint">
        <Loader2 className="size-4 animate-spin" /> सम्पादक डेस्क लोड हुँदै…
      </div>
    )
  }

  return (
    <section aria-label="सम्पादक डेस्क">
      <h2 className="font-headline text-[20px] font-extrabold text-ink">सम्पादक डेस्क</h2>
      {error && (
        <p className="mt-3 rounded-sm bg-crimson-wash px-3 py-2.5 text-[13.5px] font-medium text-crimson-deep">
          {error}
        </p>
      )}

      {/* stat row */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="आजको पेजभ्यू" value={toDevanagari(analytics.traffic.today)} tone="text-crimson" />
        <StatCard label="समीक्षामा" value={toDevanagari(queue.counts.submitted)} />
        <StatCard label="खुला पिच" value={toDevanagari(queue.counts.openPitches)} />
        <StatCard label="प्रकाशित समाचार" value={toDevanagari(queue.counts.published)} />
        <StatCard label="प्रतिक्रिया" value={toDevanagari(queue.counts.comments)} />
      </div>

      <div className="mt-8 grid gap-x-10 gap-y-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {/* review queue */}
          <h3 className="font-headline text-[17px] font-extrabold text-ink">
            प्रकाशन समीक्षा — समाचार
          </h3>
          {queue.articles.length === 0 ? (
            <p className="paper-card mt-3 rounded-sm p-5 text-[14px] text-ink-faint">
              कुनै समाचार समीक्षामा छैन।
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {queue.articles.map((a) => (
                <li key={a.slug} className="paper-card rounded-sm p-4">
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => (e === a.slug ? null : a.slug))}
                    className="w-full text-left"
                    aria-expanded={expanded === a.slug}
                  >
                    <p className="font-headline text-[16.5px] font-bold leading-snug text-ink">
                      {a.titleNe}
                    </p>
                    <p className="mt-1 text-[12.5px] text-ink-faint">
                      {desks.find((d) => d.slug === a.desk)?.nameNe} · {a.authorName} ·{' '}
                      {new Date(a.updatedAt).toLocaleDateString('ne-NP')}
                    </p>
                    <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">
                      {a.deckNe}
                    </p>
                  </button>
                  {expanded === a.slug && <BlocksPreview raw={a.bodyNe} />}

                  <div className="mt-3 border-t border-rule pt-3">
                    <input
                      value={note[a.slug] ?? ''}
                      onChange={(e) => setNote((n) => ({ ...n, [a.slug]: e.target.value }))}
                      placeholder="सम्पादकीय टिपोट (वैकल्पिक — अस्वीकार गर्दा कारण लेख्नुहोस्)"
                      className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busySlug === a.slug}
                        onClick={() => void reviewArticle(a.slug, 'publish')}
                        className="flex items-center gap-1.5 rounded-sm bg-market-green px-4 py-2 font-headline text-[13.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
                      >
                        <Check className="size-4" /> प्रकाशित गर्नुहोस्
                      </button>
                      <button
                        type="button"
                        disabled={busySlug === a.slug}
                        onClick={() => void reviewArticle(a.slug, 'decline')}
                        className="flex items-center gap-1.5 rounded-sm border border-crimson px-4 py-2 font-headline text-[13.5px] font-bold text-crimson hover:bg-crimson-wash disabled:opacity-60"
                      >
                        <X className="size-4" /> अस्वीकार
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* pitch triage */}
          <h3 className="mt-8 font-headline text-[17px] font-extrabold text-ink">पिच समीक्षा</h3>
          {queue.pitches.length === 0 ? (
            <p className="paper-card mt-3 rounded-sm p-5 text-[14px] text-ink-faint">
              कुनै पिच खुला छैन।
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {queue.pitches.map((p) => (
                <li key={p.id} className="paper-card rounded-sm p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-headline text-[15.5px] font-bold text-ink">{p.headline}</p>
                    <span className="rounded-sm bg-gold/20 px-2 py-0.5 font-headline text-[11.5px] font-bold text-[#8a6d1a]">
                      {p.status === 'in_review' ? 'समीक्षामा' : 'पठाइएको'}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{p.summary}</p>
                  <p className="mt-1 text-[11.5px] text-ink-faint">
                    {p.journalistName} · {desks.find((d) => d.slug === p.desk)?.nameNe}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busySlug === p.id}
                      onClick={() => void reviewPitch(p.id, 'in_review')}
                      className="rounded-sm border border-rule px-3 py-1.5 font-headline text-[12.5px] font-bold text-ink-soft hover:border-gold hover:text-[#8a6d1a]"
                    >
                      समीक्षामा राख्नुहोस्
                    </button>
                    <button
                      type="button"
                      disabled={busySlug === p.id}
                      onClick={() => void reviewPitch(p.id, 'accepted')}
                      className="rounded-sm bg-market-green px-3 py-1.5 font-headline text-[12.5px] font-bold text-white hover:opacity-90"
                    >
                      स्वीकार
                    </button>
                    <button
                      type="button"
                      disabled={busySlug === p.id}
                      onClick={() => void reviewPitch(p.id, 'declined')}
                      className="rounded-sm border border-crimson px-3 py-1.5 font-headline text-[12.5px] font-bold text-crimson hover:bg-crimson-wash"
                    >
                      अस्वीकार
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* comment moderation */}
          <h3 className="mt-8 font-headline text-[17px] font-extrabold text-ink">
            ताजा प्रतिक्रिया (नियमन)
          </h3>
          {queue.comments.length === 0 ? (
            <p className="paper-card mt-3 rounded-sm p-5 text-[14px] text-ink-faint">
              कुनै प्रतिक्रिया छैन।
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {queue.comments.slice(0, 6).map((c) => (
                <li key={c.id} className="paper-card rounded-sm p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-bold text-ink">
                        {c.authorName}{' '}
                        <span className="font-normal text-ink-faint">· {c.storyKey}</span>
                      </p>
                      <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">
                        {c.body}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        disabled={busySlug === c.id}
                        onClick={() => void moderateComment(c.id, 'hide')}
                        title="लुकाउनुहोस्"
                        className="rounded-sm border border-rule p-1.5 text-ink-faint hover:border-gold hover:text-[#8a6d1a]"
                      >
                        <EyeOff className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busySlug === c.id}
                        onClick={() => void moderateComment(c.id, 'delete')}
                        title="मेट्नुहोस्"
                        className="rounded-sm border border-rule p-1.5 text-ink-faint hover:border-crimson hover:text-crimson"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* right rail: launch check + breaking + analytics + ads + subscribers */}
        <div className="space-y-8">
          <LaunchCheckPanel />
          <div className="paper-card rounded-sm p-5">
            <p className="flex items-center gap-2 font-headline text-[15px] font-extrabold text-ink">
              <Megaphone className="size-4 text-crimson" /> तत्काल समाचार
            </p>
            {breaking && (
              <div className="mt-3 rounded-sm bg-crimson-deep px-3 py-2.5">
                <p className="font-headline text-[13.5px] font-bold text-white">{breaking.textNe}</p>
                {breaking.link && <p className="mt-0.5 text-[11.5px] text-white/70">{breaking.link}</p>}
              </div>
            )}
            <div className="mt-3 space-y-2.5">
              <textarea
                rows={2}
                maxLength={240}
                value={breakingText}
                onChange={(e) => setBreakingText(e.target.value)}
                placeholder="तत्काल समाचारको पाठ (जस्तै: सडक दुर्घटनामा घाइते — विवरण आउँदै)"
                className="w-full resize-y rounded-sm border border-rule bg-paper px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none"
              />
              <input
                value={breakingLink}
                onChange={(e) => setBreakingLink(e.target.value)}
                placeholder="लिंक (वैकल्पिक): politics/some-slug"
                className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={breakingBusy || breakingText.trim().length < 5}
                  onClick={() => void saveBreaking()}
                  className="rounded-sm bg-crimson px-4 py-2 font-headline text-[13px] font-bold text-white hover:bg-crimson-deep disabled:opacity-60"
                >
                  राख्नुहोस्
                </button>
                {breaking && (
                  <button
                    type="button"
                    disabled={breakingBusy}
                    onClick={() => void clearBreaking()}
                    className="rounded-sm border border-rule px-4 py-2 font-headline text-[13px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
                  >
                    हटाउनुहोस्
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="paper-card rounded-sm p-5">
            <p className="flex items-center gap-2 font-headline text-[15px] font-extrabold text-ink">
              <BarChart3 className="size-4 text-crimson" /> ट्राफिक (७ दिन)
            </p>
            <div className="mt-4 flex h-28 items-end gap-1.5" aria-hidden="true">
              {analytics.traffic.daily.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-crimson/75"
                    style={{ height: `${Math.max(4, (d.views / maxDaily) * 88)}px` }}
                    title={`${d.day}: ${d.views}`}
                  />
                  <span className="text-[9.5px] text-ink-faint">{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rule pt-3 text-[13px]">
              <p className="text-ink-soft">
                आज: <span className="font-headline font-bold text-ink">{toDevanagari(analytics.traffic.today)}</span>
              </p>
              <p className="text-ink-soft">
                साता: <span className="font-headline font-bold text-ink">{toDevanagari(analytics.traffic.week)}</span>
              </p>
              <p className="text-ink-soft">
                पाठक: <span className="font-headline font-bold text-ink">{toDevanagari(analytics.audience.readers)}</span>
              </p>
              <p className="text-ink-soft">
                सदस्य: <span className="font-headline font-bold text-ink">{toDevanagari(analytics.audience.subscribers)}</span>
              </p>
            </div>
          </div>

          <div className="paper-card rounded-sm p-5">
            <p className="font-headline text-[15px] font-extrabold text-ink">धेरै पढिएको (७ दिन)</p>
            {analytics.topStories.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-faint">अझै डेटा जम्मा भइरहेको छ।</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {analytics.topStories.slice(0, 6).map((t, i) => (
                  <li key={t.storyKey} className="flex items-baseline gap-2.5">
                    <span className="font-headline text-[15px] font-extrabold text-crimson/80">
                      {toDevanagari(i + 1)}
                    </span>
                    <span className="min-w-0">
                      <a
                        href={`#/${t.desk}/${t.storyKey.split('/')[1]}`}
                        className="line-clamp-1 font-headline text-[13.5px] font-bold text-ink hover:text-crimson"
                      >
                        {t.title}
                      </a>
                      <span className="text-[11px] text-ink-faint">
                        {toDevanagari(t.views)} पटक पढिएको
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="paper-card rounded-sm p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-headline text-[15px] font-extrabold text-ink">
                <Newspaper className="size-4 text-crimson" /> साँझ ब्रिफिङ सदस्य
              </p>
              <a
                href="/api/editor/subscribers?format=csv"
                className="flex items-center gap-1.5 rounded-sm border border-rule px-2.5 py-1.5 font-headline text-[12px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
              >
                <Download className="size-3.5" /> CSV
              </a>
            </div>
            {analytics.recentSubscribers.length === 0 ? (
              <p className="mt-2 text-[13px] text-ink-faint">अझै कुनै सदस्य छैन।</p>
            ) : (
              <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto">
                {analytics.recentSubscribers.map((s) => (
                  <li key={s.email} className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className="truncate text-ink-soft">{s.email}</span>
                    <span className="shrink-0 text-[11px] text-ink-faint">
                      {new Date(s.createdAt).toLocaleDateString('ne-NP')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AdsManagerPanel />

          <div className="paper-card rounded-sm p-5">
            <p className="flex items-center gap-2 font-headline text-[15px] font-extrabold text-ink">
              <MessageSquare className="size-4 text-crimson" /> समाचार पाइपलाइन
            </p>
            <dl className="mt-3 space-y-1.5 text-[13.5px]">
              {[
                ['ड्राफ्टमा', analytics.pipeline.drafts],
                ['समीक्षामा', analytics.pipeline.submitted],
                ['प्रकाशित', analytics.pipeline.published],
                ['अस्वीकृत', analytics.pipeline.declined],
                ['स्वीकृत पिच', analytics.pipeline.acceptedPitches],
              ].map(([label, n]) => (
                <div key={String(label)} className="flex items-baseline justify-between border-b border-rule/60 pb-1.5">
                  <dt className="text-ink-soft">{label}</dt>
                  <dd className="font-headline font-bold text-ink">{toDevanagari(Number(n))}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
