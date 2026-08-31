'use client'

import { useEffect, useMemo, useState } from 'react'
import { adToBs, formatBsFull, toDevanagari } from '@/lib/news/patro'
import { nepseMovers } from '@/lib/news/nepse'
import { useMarket } from '@/lib/news/market-store'
import { desks, provinces, stories, type Story } from '@/lib/news/data'
import {
  byDesk,
  deskName,
  deskRole,
  findStory,
  latest,
  leadStory,
  storyUrl,
  supportPair,
} from '@/lib/news/utils'
import { usePoll } from '@/lib/news/poll-store'
import { dbArticleToStory, useDbArticles } from '@/lib/news/article-store'
import { href } from '@/lib/news/router'
import {
  HeroImage,
  Kicker,
  LatestItem,
  MetaLine,
  PhotoCard,
  RowCard,
  SectionHeader,
  VoiceCard,
} from './cards'

const container = 'mx-auto w-full max-w-[1180px] px-4'

/* ------------------------------- Lead ---------------------------------- */

function Lead() {
  const lead = useMemo(() => leadStory(), [])
  return (
    <section className="relative" aria-label="आजको मुख्य समाचार">
      <a href={storyUrl(lead)} className="group block">
        <div className="relative">
          <HeroImage
            story={lead}
            priority
            ratio="aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/8.2]"
            sizes="100vw"
          />
          <div className="lead-scrim absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0">
            <div className={`${container} pb-5 pt-16 md:pb-8`}>
              <p className="mb-2 flex items-center gap-2.5">
                <span className="rounded-sm bg-crimson px-2 py-0.5 font-headline text-[12px] font-bold uppercase text-white">
                  मुख्य समाचार
                </span>
                <span className="font-headline text-[12.5px] font-bold uppercase text-white/85">
                  {desks.find((d) => d.slug === lead.desk)?.nameNe}
                </span>
              </p>
              <h1 className="headline-lead max-w-[21ch] text-balance text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
                {lead.titleNe}
              </h1>
              <p className="mt-3 hidden max-w-[62ch] text-[16.5px] leading-relaxed text-white/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.55)] sm:block">
                {lead.deckNe}
              </p>
              <p className="mt-3 flex items-center gap-2 text-[12.5px] text-white/70">
                <span>{lead.location}</span>
                <span aria-hidden="true">·</span>
                <span>{lead.author}</span>
                <span aria-hidden="true">·</span>
                <span>{toDevanagari(lead.readingMinutes)} मिनेट</span>
              </p>
            </div>
          </div>
        </div>
      </a>
    </section>
  )
}

/* --------------------------- Support pair -------------------------------- */

function SupportPair({ excludeSlug }: { excludeSlug: string }) {
  const pair = useMemo(() => supportPair(excludeSlug), [excludeSlug])
  return (
    <section className="border-b border-rule" aria-label="मुख्य समाचारहरू">
      <div className={`${container} grid gap-x-6 gap-y-8 py-7 sm:grid-cols-2 md:py-9`}>
        {pair.map((story, i) => (
          <article key={story.slug} className="group">
            <Kicker desk={story.desk} />
            <a href={storyUrl(story)} className="block">
              <div className="mt-1.5">
                <HeroImage
                  story={story}
                  priority={i === 0}
                  ratio="aspect-[16/9]"
                  rounded="rounded-sm"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <h2 className="headline-support mt-3 text-ink group-hover:text-crimson transition-colors">
                  {story.titleNe}
                </h2>
                <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ink-soft">
                  {story.deckNe}
                </p>
                <MetaLine story={story} />
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Poll ------------------------------------- */

function Poll() {
  const { poll, loading, voting, error, vote } = usePoll()

  if (loading) {
    return (
      <section className="paper-card rounded-sm p-4" aria-label="आजको जनमत" aria-busy="true">
        <div className="h-4 w-24 animate-pulse rounded-full bg-rule/60" />
        <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-rule/40" />
        <div className="mt-4 space-y-2">
          <div className="h-11 animate-pulse rounded-sm bg-rule/30" />
          <div className="h-11 animate-pulse rounded-sm bg-rule/30" />
          <div className="h-11 animate-pulse rounded-sm bg-rule/30" />
        </div>
      </section>
    )
  }

  if (!poll) return null

  const total = poll.totalVotes

  return (
    <section className="paper-card rounded-sm p-4" aria-label="आजको जनमत">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-[17px] font-extrabold text-ink">आजको जनमत</h3>
        <span className="text-[11px] uppercase text-ink-faint">
          {toDevanagari(total)} मत
        </span>
      </div>
      <p className="mt-1.5 text-[14.5px] font-medium leading-relaxed text-ink">{poll.question}</p>
      {poll.myVote === null ? (
        <div className="mt-3 space-y-2">
          {poll.options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={voting}
              onClick={() => void vote(opt.id)}
              className="flex min-h-[44px] w-full items-center justify-between rounded-sm border border-rule px-3 py-2 text-left font-headline text-[15px] font-semibold text-ink transition-colors hover:border-crimson hover:bg-crimson-wash disabled:opacity-60"
            >
              {opt.label}
              <span className="text-crimson">{voting ? '…' : 'मत दिनुहोस्'}</span>
            </button>
          ))}
          {error && <p className="text-[12.5px] font-medium text-crimson">{error}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          {poll.options.map((opt) => {
            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
            const mine = poll.myVote === opt.id
            return (
              <div key={opt.id}>
                <div className="mb-1 flex items-center justify-between text-[13.5px]">
                  <span className={`font-semibold ${mine ? 'text-crimson' : 'text-ink'}`}>
                    {opt.label}
                    {mine && <span className="ml-1.5 text-[11px] uppercase">(तपाईंको मत)</span>}
                  </span>
                  <span className="font-headline font-bold tabular-nums text-ink-soft">
                    {toDevanagari(pct)}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-rule/60">
                  <div
                    className={`h-full rounded-full ${mine ? 'bg-crimson' : 'bg-crimson/45'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="pt-1 text-[11.5px] text-ink-faint">
            मत सर्भरमा गणना हुन्छ — प्रत्येक व्यक्तिले एक पटक मात्र मत दिन सक्छ।
          </p>
        </div>
      )}
    </section>
  )
}

/* --------------------------- पात्रो mini ---------------------------------- */

interface PatroDay {
  bsDay: number
  events: { nameNe: string; holiday?: boolean }[]
  holiday: boolean
  tithi: string
}

function PatroMini() {
  const today = useMemo(() => adToBs(new Date()), [])
  const [data, setData] = useState<{
    today: { tithi: string; events: { nameNe: string; holiday?: boolean }[]; holiday: boolean } | null
    upcoming: { day: number; nameNe: string }[]
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const monthUrl = (y: number, m: number) => `/api/patro?year=${y}&month=${m}`
    void (async () => {
      try {
        const res = await fetch(monthUrl(today.year, today.month), { cache: 'no-store' })
        if (!res.ok) return
        const j = (await res.json()) as {
          today: { tithi: string; events: { nameNe: string; holiday?: boolean }[]; holiday: boolean }
          month: { daysData: PatroDay[]; bsYear: number; bsMonth: number }
        }
        if (cancelled) return
        const upcoming: { day: number; nameNe: string }[] = []
        for (const d of j.month.daysData) {
          if (d.bsDay <= today.day) continue
          for (const e of d.events) upcoming.push({ day: d.bsDay, nameNe: e.nameNe })
        }
        // top up from next month if the current month runs short
        if (upcoming.length < 3) {
          const ny = today.month === 12 ? today.year + 1 : today.year
          const nm = today.month === 12 ? 1 : today.month + 1
          try {
            const res2 = await fetch(monthUrl(ny, nm), { cache: 'no-store' })
            if (res2.ok) {
              const j2 = (await res2.json()) as { month: { daysData: PatroDay[] } }
              for (const d of j2.month.daysData) {
                if (upcoming.length >= 3) break
                for (const e of d.events) {
                  if (upcoming.length >= 3) break
                  upcoming.push({ day: d.bsDay, nameNe: e.nameNe })
                }
              }
            }
          } catch {
            /* keep what we have */
          }
        }
        if (!cancelled) setData({ today: j.today, upcoming: upcoming.slice(0, 3) })
      } catch {
        /* patro mini stays quiet on failure */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [today])

  return (
    <section className="paper-card rounded-sm p-4" aria-label="आजको पात्रो">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-[17px] font-extrabold text-ink">आजको पात्रो</h3>
        <a
          href={href('/patro')}
          className="font-headline text-[13px] font-bold text-crimson hover:underline underline-offset-4"
        >
          पूरा पात्रो →
        </a>
      </div>
      <p className="mt-1.5 font-headline text-[21px] font-extrabold text-crimson">
        {formatBsFull(today)}
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        {data?.today ? data.today.tithi : 'पञ्चाङ्ग लोड हुँदै…'}
      </p>
      {data?.today && data.today.events.length > 0 && (
        <div className="mt-2.5 border-t border-rule pt-2.5">
          {data.today.events.map((e) => (
            <p key={e.nameNe} className="text-[14px] font-semibold text-ink">
              <span className="text-gold">◆</span> {e.nameNe}
              {e.holiday && (
                <span className="ml-1.5 rounded-sm bg-crimson-wash px-1.5 py-0.5 font-headline text-[11px] font-bold text-crimson">
                  सार्वजनिक बिदा
                </span>
              )}
            </p>
          ))}
        </div>
      )}
      {data?.today?.holiday && (
        <p className="mt-2 text-[12.5px] font-semibold text-crimson">आज साप्ताहिक बिदा हो</p>
      )}
      {data && data.upcoming.length > 0 && (
        <div className="mt-2 border-t border-rule pt-2">
          <p className="mb-1 text-[11px] font-semibold uppercase text-ink-faint">आउँदै गरेका</p>
          <ul className="space-y-1">
            {data.upcoming.map((u, i) => (
              <li key={`${u.nameNe}-${i}`} className="flex items-baseline gap-2 text-[13.5px] text-ink-soft">
                <span className="font-headline font-bold tabular-nums text-crimson">
                  {toDevanagari(u.day)}
                </span>
                <span>{u.nameNe}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/* ------------------------- Latest + sidebar ------------------------------ */

function LatestBlock() {
  const lead = useMemo(() => leadStory(), [])
  const pair = useMemo(() => supportPair(lead.slug), [lead.slug])
  const { dbArticles } = useDbArticles()

  const items = useMemo(() => {
    const exclusions = new Set([lead.slug, ...pair.map((p) => p.slug)])
    const live = dbArticles
      .filter((a) => !exclusions.has(a.slug))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 3)
      .map((a) => ({ story: dbArticleToStory(a), fresh: true }))
    const archive = latest(9 - live.length, [...exclusions]).map((s) => ({ story: s, fresh: false }))
    return [...live, ...archive]
  }, [lead.slug, pair, dbArticles])

  return (
    <div>
      <SectionHeader title="ताजा समाचार" />
      <div>
        {items.map(({ story, fresh }, i) => (
          <LatestItem key={story.slug} story={story} index={i} fresh={fresh} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------- Trending strip -------------------------------- */

interface TrendingRow {
  storyKey: string
  views: number
}

function TrendingStrip() {
  const { dbArticles } = useDbArticles()
  const [rows, setRows] = useState<TrendingRow[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/trending', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { trending: [] }))
      .then((j: { trending: TrendingRow[] }) => {
        if (!cancelled) setRows(j.trending ?? [])
      })
      .catch(() => {
        if (!cancelled) setRows([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const resolved = useMemo(() => {
    if (!rows) return null
    return rows
      .map((r) => {
        const [desk, slug] = r.storyKey.split('/')
        const story = findStory(desk ?? '', slug ?? '')
        const dbMatch = dbArticles.find((a) => a.desk === desk && a.slug === slug)
        const storyObj = story ?? (dbMatch ? dbArticleToStory(dbMatch) : undefined)
        return storyObj ? { story: storyObj, views: r.views } : null
      })
      .filter((x): x is { story: Story; views: number } => x !== null)
      .slice(0, 4)
  }, [rows, dbArticles])

  if (resolved === null || resolved.length === 0) return null

  return (
    <section className="border-b border-rule bg-surface-soft py-6 md:py-7" aria-label="धेरै पढिएको">
      <div className={container}>
        <div className="flex items-center gap-3">
          <h2 className="font-headline text-[18px] font-extrabold text-ink">धेरै पढिएको</h2>
          <span className="text-[11px] uppercase text-ink-faint">पछिल्लो ७ दिन</span>
        </div>
        <ol className="mt-4 grid gap-x-6 gap-y-0 sm:grid-cols-2">
          {resolved.map(({ story, views }, i) => (
            <li key={story.slug} className="border-b border-rule/70 py-3 last:border-b-0 sm:odd:border-b sm:[&:nth-last-child(-n+2)]:border-b-0">
              <a href={href(`/${story.desk}/${story.slug}`)} className="group flex items-start gap-3">
                <span className="font-headline text-[24px] font-extrabold leading-none text-crimson/80">
                  {toDevanagari(i + 1)}
                </span>
                <span className="min-w-0">
                  <span className="block font-headline text-[15.5px] font-bold leading-snug text-ink transition-colors group-hover:text-crimson">
                    {story.titleNe}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-ink-faint">
                    {deskName(story.desk)} · {toDevanagari(views)} पटक पढिएको
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* -------------------------- NEPSE market well ----------------------------- */

function MarketWell() {
  const { market } = useMarket()
  const nepse = market?.nepse
  const metals = market?.metals
  const gainers = nepseMovers.filter((m) => m.changePct > 0).slice(0, 4)
  const losers = nepseMovers.filter((m) => m.changePct < 0).slice(0, 4)
  const indexUp = (nepse?.index.changePct ?? 0) >= 0
  const sensUp = (nepse?.sensitive.changePct ?? 0) >= 0
  return (
    <div className="paper-card rounded-sm p-4">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <h3 className="font-headline text-[17px] font-extrabold text-ink">बजार</h3>
        <a
          href={href('/nepse')}
          className="font-headline text-[13px] font-bold text-crimson hover:underline underline-offset-4"
        >
          विस्तृत →
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-ink-faint">नेप्से सूचकांक</p>
          <p className="font-headline text-[26px] font-extrabold leading-tight tabular-nums text-ink">
            {nepse ? toDevanagari(nepse.index.value.toFixed(2)) : '…'}
          </p>
          {nepse && (
            <p
              className={`font-headline text-[13px] font-bold tabular-nums ${
                indexUp ? 'text-market-green' : 'text-crimson'
              }`}
            >
              {indexUp ? '▲' : '▼'} {toDevanagari(Math.abs(nepse.index.changeAbs).toFixed(2))} (
              {toDevanagari(Math.abs(nepse.index.changePct).toFixed(2))}%)
            </p>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase text-ink-faint">सुन (तोला)</p>
          <p className="font-headline text-[26px] font-extrabold leading-tight tabular-nums text-ink">
            {metals ? `रु ${toDevanagari(metals.goldTola.toLocaleString('en-IN'))}` : '…'}
          </p>
          {nepse && (
            <p
              className={`font-headline text-[13px] font-bold tabular-nums ${
                sensUp ? 'text-market-green' : 'text-crimson'
              }`}
            >
              संवेदनशील {toDevanagari(nepse.sensitive.value.toFixed(2))} (
              {toDevanagari(Math.abs(nepse.sensitive.changePct).toFixed(2))}%)
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 border-t border-rule pt-2">
        {[
          { title: 'बढ्ने', list: gainers, cls: 'text-market-green' },
          { title: 'घट्ने', list: losers, cls: 'text-crimson' },
        ].map((col) => (
          <div key={col.title}>
            <p className="py-1.5 text-[11px] uppercase text-ink-faint">
              {col.title} — शीर्ष ४
            </p>
            <ul className="divide-y divide-rule">
              {col.list.map((m) => (
                <li key={m.symbol} className="flex items-baseline justify-between py-1.5">
                  <span className="font-headline text-[14px] font-bold text-ink">{m.symbol}</span>
                  <span className={`font-headline text-[13px] font-bold tabular-nums ${col.cls}`}>
                    {m.changePct > 0 ? '+' : '−'}
                    {toDevanagari(Math.abs(m.changePct).toFixed(2))}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2.5 border-t border-rule pt-2 text-[11.5px] text-ink-faint">
        {nepse
          ? `कारोबार ${nepse.turnover} · ${
              nepse.source === 'live' ? 'लाइभ' : 'अन्तिम उपलब्ध दर'
            } · मुद्रा दर राष्ट्र बैंकबाट`
          : 'बजार तथ्यांक लोड हुँदै…'}
      </p>
    </div>
  )
}

/* ----------------------------- Desk sections ----------------------------- */

function NewsDeskSection({ desk, lead }: { desk: string; lead?: Story }) {
  const items = useMemo(() => byDesk(desk).filter((s) => s.slug !== lead?.slug), [desk, lead])
  if (items.length === 0) return null
  const first = items[0]!
  const rest = items.slice(1, 4)
  const deskInfo = desks.find((d) => d.slug === desk)!
  return (
    <section className="border-t border-rule py-7 md:py-9" aria-label={deskInfo.nameNe}>
      <div className={container}>
        <SectionHeader title={deskInfo.nameNe} link={`/${desk}`} />
        <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
          <article className="group">
            <a href={storyUrl(first)} className="block">
              <HeroImage story={first} ratio="aspect-[16/9]" rounded="rounded-sm" sizes="(max-width: 768px) 100vw, 50vw" />
              <div className="pt-2.5">
                <h3 className="headline-support text-ink group-hover:text-crimson transition-colors">
                  {first.titleNe}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-soft">
                  {first.deckNe}
                </p>
                <MetaLine story={first} />
              </div>
            </a>
          </article>
          <div className="space-y-4 md:border-l md:border-rule md:pl-6">
            {rest.map((s) => (
              <RowCard key={s.slug} story={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MarketDeskSection() {
  const items = useMemo(() => byDesk('business'), [])
  if (items.length === 0) return null
  const rest = items.slice(1, 5)
  return (
    <section className="border-t border-rule py-7 md:py-9" aria-label="बजार">
      <div className={container}>
        <SectionHeader title="बजार" link="/business" />
        <div className="grid gap-x-6 gap-y-6 lg:grid-cols-[1.2fr_1fr]">
          <article className="group">
            <a href={storyUrl(items[0]!)} className="block">
              <HeroImage story={items[0]!} ratio="aspect-[16/9]" rounded="rounded-sm" sizes="(max-width: 1024px) 100vw, 55vw" />
              <div className="pt-2.5">
                <h3 className="headline-support text-ink group-hover:text-crimson transition-colors">
                  {items[0]!.titleNe}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-soft">
                  {items[0]!.deckNe}
                </p>
                <MetaLine story={items[0]!} />
              </div>
            </a>
          </article>
          <div className="space-y-4">
            <MarketWell />
            {rest.slice(0, 2).map((s) => (
              <RowCard key={s.slug} story={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PhotoDeskSection({ desk }: { desk: string }) {
  const items = useMemo(() => byDesk(desk), [desk])
  if (items.length === 0) return null
  const deskInfo = desks.find((d) => d.slug === desk)!
  const row1 = items.slice(0, 3)
  const row2 = items.slice(3, 5)
  return (
    <section className="border-t border-rule py-7 md:py-9" aria-label={deskInfo.nameNe}>
      <div className={container}>
        <SectionHeader title={deskInfo.nameNe} link={`/${desk}`} />
        <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {row1.map((s, i) => (
            <PhotoCard key={s.slug} story={s} priority={i === 0} />
          ))}
        </div>
        {row2.length > 0 && (
          <div className="mt-7 grid gap-x-6 md:grid-cols-2">
            {row2.map((s) => (
              <RowCard key={s.slug} story={s} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function VoicesSection() {
  const opinion = useMemo(() => byDesk('opinion'), [])
  const literature = useMemo(() => byDesk('literature'), [])
  if (opinion.length === 0) return null
  const voices = [...opinion.slice(0, 2), ...literature.slice(0, 2)]
  return (
    <section className="border-t border-rule py-7 md:py-9" aria-label="विचार">
      <div className={container}>
        <SectionHeader title="विचार" link="/opinion" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {voices.map((s) => (
            <VoiceCard key={s.slug} story={s} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* --------------------------- Province strip ------------------------------- */

function ProvinceStrip() {
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of stories) map.set(s.province, (map.get(s.province) ?? 0) + 1)
    return map
  }, [])
  return (
    <section className="border-t border-rule bg-surface-soft py-7 md:py-8" aria-label="सातै प्रदेश">
      <div className={container}>
        <SectionHeader title="सातै प्रदेश" link="/province" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {provinces.map((p, i) => (
            <a
              key={p.slug}
              href={href(`/province/${p.slug}`)}
              className="group rounded-sm border border-rule bg-surface p-3.5 transition-colors hover:border-crimson"
            >
              <p className="font-headline text-[11px] font-bold uppercase text-ink-faint">
                प्रदेश {toDevanagari(i + 1)}
              </p>
              <p className="mt-1 font-headline text-[17px] font-extrabold text-ink group-hover:text-crimson transition-colors">
                {p.nameNe.replace(' प्रदेश', '')}
              </p>
              <p className="mt-1.5 font-headline text-[22px] font-extrabold leading-none text-crimson tabular-nums">
                {toDevanagari(counts.get(p.slug) ?? 0)}
                <span className="ml-1 text-[12px] font-semibold text-ink-faint">समाचार</span>
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Ad slot ----------------------------------- */

function AdSlot() {
  return (
    <section className="border-t border-rule py-7" aria-label="विज्ञापन">
      <div className={container}>
        <p className="mb-2 text-center text-[10.5px] uppercase text-ink-faint">
          विज्ञापन · Advertisement
        </p>
        <div className="mx-auto flex max-w-[970px] flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-rule-strong bg-surface-soft px-6 py-8 text-center md:flex-row md:gap-8">
          <div className="grid size-16 place-items-center rounded-full bg-crimson-wash">
            <span className="font-headline text-2xl font-extrabold text-crimson">ना</span>
          </div>
          <div className="max-w-md">
            <p className="font-headline text-[19px] font-extrabold text-ink">
              तपाईंको ब्रान्ड, नागरिकको सामुन्ने
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
              नागरिक वाचमा विज्ञापनका लागि सम्पर्क गर्नुहोस् — गृहपृष्ठ, डेस्क र लेख वरिपरि
              स्पष्ट रूपमा चिनो लगाइएका स्लटहरू उपलब्ध छन्।
            </p>
          </div>
          <a
            href={href('/page/advertise')}
            className="rounded-sm bg-crimson px-5 py-2.5 font-headline text-[15px] font-bold text-white transition-transform hover:-translate-y-px"
          >
            जानकारी लिनुहोस्
          </a>
        </div>
      </div>
    </section>
  )
}

/* --------------------------- Evening briefing ----------------------------- */

function EveningBriefing() {
  const items = useMemo(
    () =>
      [...stories]
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, 5),
    [],
  )
  return (
    <section className="border-t border-rule py-7 md:py-9" aria-label="साँझ ब्रिफिङ">
      <div className={container}>
        <div className="paper-card rounded-sm bg-crimson-wash/60 p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-crimson/25 pb-3">
            <div>
              <p className="kicker">साँझ ब्रिफिङ</p>
              <h2 className="mt-1 font-headline text-[24px] font-extrabold text-ink md:text-[28px]">
                आजको दिन, पाँच सूत्रमा
              </h2>
            </div>
            <p className="font-headline text-[13px] font-semibold text-ink-soft">
              प्रकाशित: आज साँझ ६:०० बजे
            </p>
          </div>
          <ol className="mt-4 space-y-4">
            {items.map((s, i) => (
              <li key={s.slug} className="flex gap-4">
                <span className="font-headline text-[24px] font-extrabold leading-none text-crimson/80 tabular-nums">
                  {toDevanagari(i + 1)}
                </span>
                <div>
                  <a
                    href={storyUrl(s)}
                    className="font-headline text-[16.5px] font-bold text-ink hover:text-crimson transition-colors"
                  >
                    {s.titleNe}
                  </a>
                  <p className="mt-0.5 line-clamp-1 text-[13.5px] text-ink-soft">{s.deckNe}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ------------------------- Remaining feature desks ------------------------- */

function FeatureDeskSection({ desk }: { desk: string }) {
  const items = useMemo(() => byDesk(desk), [desk])
  if (items.length === 0) return null
  const deskInfo = desks.find((d) => d.slug === desk)!
  const first = items[0]!
  const rest = items.slice(1, 5)
  return (
    <section className="border-t border-rule py-7 md:py-9" aria-label={deskInfo.nameNe}>
      <div className={container}>
        <SectionHeader title={deskInfo.nameNe} link={`/${desk}`} />
        <div className="grid gap-x-6 gap-y-6 md:grid-cols-[1fr_1.15fr]">
          <article className="group">
            <a href={storyUrl(first)} className="block">
              <HeroImage story={first} ratio="aspect-[16/10]" rounded="rounded-sm" sizes="(max-width: 768px) 100vw, 45vw" />
              <div className="pt-2.5">
                <h3 className="headline-card text-[20px] text-ink group-hover:text-crimson transition-colors">
                  {first.titleNe}
                </h3>
                <p className="mt-1 line-clamp-2 text-[14.5px] leading-relaxed text-ink-soft">
                  {first.deckNe}
                </p>
                <MetaLine story={first} />
              </div>
            </a>
          </article>
          <div className="space-y-4 md:border-l md:border-rule md:pl-6">
            {rest.map((s) => (
              <RowCard key={s.slug} story={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- Edition ---------------------------------- */

export default function HomeEdition() {
  const lead = useMemo(() => leadStory(), [])
  return (
    <main id="main">
      <Lead />
      <SupportPair excludeSlug={lead.slug} />

      <section className="border-b border-rule py-7 md:py-9" aria-label="ताजा समाचार र उपकरण">
        <div className={container}>
          <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[1.5fr_1fr]">
            <LatestBlock />
            <div className="space-y-6">
              <PatroMini />
              <Poll />
            </div>
          </div>
        </div>
      </section>

      <TrendingStrip />

      <NewsDeskSection desk="politics" />
      <MarketDeskSection />
      <NewsDeskSection desk="society" />
      <PhotoDeskSection desk="sports" />
      <VoicesSection />
      <PhotoDeskSection desk="entertainment" />
      <ProvinceStrip />
      <AdSlot />
      <EveningBriefing />

      <div id="desks-anchor" />
      <FeatureDeskSection desk="world" />
      <FeatureDeskSection desk="health" />
      <FeatureDeskSection desk="education" />
      <FeatureDeskSection desk="technology" />
      <FeatureDeskSection desk="interview" />
      <FeatureDeskSection desk="photo-story" />
      <FeatureDeskSection desk="video" />
      <FeatureDeskSection desk="diaspora" />
      <FeatureDeskSection desk="literature" />
    </main>
  )
}

export { deskRole }
