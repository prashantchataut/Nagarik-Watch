'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Crown,
  Eye,
  Facebook,
  Link2,
  Printer,
  Share2,
} from 'lucide-react'
import type { Story } from '@/lib/news/data'
import { desks, stories } from '@/lib/news/data'
import { heroFor } from '@/lib/news/photos'
import { href } from '@/lib/news/router'
import { deskName, storyUrl } from '@/lib/news/utils'
import { relatedFor } from '@/lib/news/recommend'
import {
  adToBs,
  formatBsFull,
  toDevanagari,
  WEEKDAYS_FULL_NE,
} from '@/lib/news/patro'
import { useSaved } from '@/lib/news/storage'
import { trackView } from '@/lib/news/engagement'
import { logRead } from '@/lib/news/read-history'
import { useMe } from '@/lib/news/auth-store'
import { usePaywall } from '@/lib/news/paywall-store'
import { usePaywallGate, PaywallWall, AdSlot } from './monetize'
import { formatDevanagariCount } from '@/lib/news/ad-store'
import CommentsSection from './CommentsSection'
import { HeroImage, Kicker, SectionHeader } from './cards'

function BsDateline({ iso }: { iso: string }) {
  const label = useMemo(() => {
    const d = new Date(iso)
    const bs = adToBs(d)
    return `${WEEKDAYS_FULL_NE[d.getDay()]}, ${formatBsFull(bs)}`
  }, [iso])
  return <>{label}</>
}

function SaveButton({
  slug,
  className = '',
}: {
  slug: string
  className?: string
}) {
  const { isSaved, toggle } = useSaved()
  const saved = isSaved(slug)
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      className={`flex min-h-[44px] items-center gap-2 rounded-sm px-3.5 py-2 font-headline text-[15px] font-bold transition-colors ${
        saved
          ? 'bg-crimson-wash text-crimson'
          : 'border border-rule text-ink hover:border-crimson hover:text-crimson'
      } ${className}`}
      aria-pressed={saved}
    >
      {saved ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
      {saved ? 'सेभ भयो' : 'सेभ गर्नुहोस्'}
    </button>
  )
}

function ShareBar({ story }: { story: Story }) {
  const [copied, setCopied] = useState(false)
  const url = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}${window.location.pathname}#${story.desk}/${story.slug}`
  }, [story])

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: story.titleNe, url })
        return
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button
        type="button"
        onClick={share}
        className="flex min-h-[44px] items-center gap-2 rounded-sm border border-rule px-3.5 py-2 font-headline text-[15px] font-bold text-ink transition-colors hover:border-crimson hover:text-crimson"
      >
        {copied ? <Check className="size-5 text-market-green" /> : <Share2 className="size-5" />}
        {copied ? 'लिंक कापियो' : 'सेयर'}
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer noopener"
        className="grid size-[44px] place-items-center rounded-sm border border-rule text-ink transition-colors hover:border-crimson hover:text-crimson"
        aria-label="फेसबुकमा सेयर गर्नुहोस्"
      >
        <Facebook className="size-5" />
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            /* ignore */
          }
        }}
        className="grid size-[44px] place-items-center rounded-sm border border-rule text-ink transition-colors hover:border-crimson hover:text-crimson"
        aria-label="लिंक काप्नुहोस्"
      >
        <Link2 className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="grid size-[44px] place-items-center rounded-sm border border-rule text-ink transition-colors hover:border-crimson hover:text-crimson"
        aria-label="प्रिन्ट गर्नुहोस्"
      >
        <Printer className="size-5" />
      </button>
    </div>
  )
}

function ReadingProgress() {
  const [pct, setPct] = useState(0)
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setPct(max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="fixed inset-x-0 top-0 z-50 no-print" aria-hidden="true">
      <div
        className="progress-hairline w-full"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  )
}

function BodyBlocks({ story }: { story: Story }) {
  const blocks = story.bodyNe.length > 0 ? story.bodyNe : story.bodyEn
  return (
    <div className="article-body text-ink">
      {blocks.map((block, i) => {
        switch (block.k) {
          case 'h2':
            return <h2 key={i}>{block.text}</h2>
          case 'h3':
            return <h3 key={i}>{block.text}</h3>
          case 'quote':
            return (
              <blockquote key={i} className="pull-quote">
                {block.text}
              </blockquote>
            )
          case 'list':
            return (
              <ul key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )
          default:
            return <p key={i}>{block.text}</p>
        }
      })}
    </div>
  )
}

export function ArticleNotFound({ desk }: { desk: string }) {
  return (
    <main id="main" className="mx-auto max-w-[680px] px-4 py-20 text-center">
      <p className="kicker">समाचार भेटिएन</p>
      <h1 className="mt-2 font-headline text-[32px] font-extrabold text-ink">
        यो लिंकको समाचार संग्रहमा छैन
      </h1>
      <p className="mt-3 text-[15.5px] text-ink-soft">
        सम्भवतः लिंक पुरानो भएको वा हटाइएको हुन सक्छ।{' '}
        <a href={href(desk ? `/${desk}` : '/')} className="font-semibold text-crimson hover:underline">
          {desk ? deskName(desk) : 'गृहपृष्ठ'}मा फर्कनुहोस्
        </a>
        ।
      </p>
    </main>
  )
}

export default function ArticleView({ story }: { story: Story }) {
  const related = useMemo(() => relatedFor(story, [...stories], 4), [story])
  const deskInfo = desks.find((d) => d.slug === story.desk)
  const heroSrc = heroFor(story.slug, story.hero, story.desk)
  const isSvg = heroSrc.startsWith('data:image/svg')
  const storyKey = `${story.desk}/${story.slug}`
  const [viewCount, setViewCount] = useState<number | null>(null)
  const { me } = useMe()
  const paywall = usePaywall()
  const gate = usePaywallGate(storyKey, Boolean(story.premium))
  const gatedStory = useMemo<Story | null>(() => {
    if (!gate.blocked) return null
    const cut = Math.max(3, Math.floor(story.bodyNe.length * 0.3))
    return { ...story, bodyNe: story.bodyNe.slice(0, cut) }
  }, [gate.blocked, story])

  // Count one view per browser session for the trending engine,
  // log to the reading history for personalization, and show the count.
  useEffect(() => {
    trackView(storyKey)
    logRead(storyKey, story.desk, story.tags, me?.id ?? null)
  }, [storyKey, story.desk, story.tags, me?.id])

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/views?keys=${encodeURIComponent(storyKey)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { views?: Record<string, number> } | null) => {
        if (!cancelled && data?.views) setViewCount(data.views[storyKey] ?? 0)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [storyKey])

  return (
    <main id="main">
      <ReadingProgress />

      <article className="article-measure px-4 pb-10 pt-7 md:pt-10">
        {/* Breadcrumb */}
        <nav aria-label="बाटो" className="mb-4 text-[13px] text-ink-faint no-print">
          <a href={href('/')} className="hover:text-crimson">
            गृह
          </a>
          <span className="mx-1.5">/</span>
          <a href={href(`/${story.desk}`)} className="hover:text-crimson">
            {deskInfo?.nameNe}
          </a>
        </nav>

        <Kicker desk={story.desk} />
        {story.premium && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-sm bg-ink px-2 py-0.5 align-middle font-headline text-[11px] font-bold uppercase text-paper">
            <Crown className="size-3" aria-hidden /> प्रिमियम
          </span>
        )}
        <h1 className="mt-2 font-headline text-[clamp(28px,4.4vw,44px)] font-extrabold leading-[1.22] text-ink">
          {story.titleNe}
        </h1>
        {story.deckNe && (
          <p className="mt-4 border-l-[3px] border-crimson/60 pl-4 text-[17.5px] leading-[1.75] text-ink-soft">
            {story.deckNe}
          </p>
        )}

        {/* Byline row */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-rule py-3 no-print">
          <div className="text-[13.5px] leading-relaxed text-ink-soft">
            <p className="font-headline text-[15px] font-bold text-ink">{story.author}</p>
            <p>
              {story.location} · <BsDateline iso={story.publishedAt} /> ·{' '}
              {toDevanagari(story.readingMinutes)} मिनेट पढाइ
              {viewCount !== null && viewCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-crimson-deep">
                  <Eye className="size-3.5" aria-hidden /> {formatDevanagariCount(viewCount)} पटक पढिएको
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveButton slug={story.slug} />
            <ShareBar story={story} />
          </div>
        </div>

        {/* Hero */}
        <figure className="my-6">
          <div className="overflow-hidden rounded-sm">
            <img
              src={heroSrc}
              alt={story.heroCaption || story.titleNe}
              className={`w-full object-cover ${isSvg ? '' : 'hover:scale-[1.02] transition-transform duration-500'}`}
              loading="eager"
            />
          </div>
          <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-[12.5px] text-ink-faint">
            <span>{story.heroCaption}</span>
            <span>
              {heroSrc.startsWith('/photos/desks/')
                ? 'चित्र: नागरिक वाच (सम्पादकीय चित्र)'
                : story.heroCredit
                  ? `तस्वीर: ${story.heroCredit}`
                  : ''}
            </span>
          </figcaption>
        </figure>

        {gatedStory ? (
          <>
            <BodyBlocks story={gatedStory} />
            <PaywallWall premium={Boolean(story.premium)} remaining={paywall.remaining} />
          </>
        ) : (
          <>
            <BodyBlocks story={story} />
            {/* Inline ad after the body (labeled, skippable by design) */}
            <div className="my-10 no-print">
              <AdSlot placement="article_inline" />
            </div>
          </>
        )}

        {/* Tags */}
        {story.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-rule pt-5 no-print">
            <span className="text-[12px] uppercase text-ink-faint">विषय:</span>
            {story.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-rule px-3 py-1 font-headline text-[13px] font-semibold text-ink-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* End actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-surface-soft p-4 no-print">
          <SaveButton slug={story.slug} />
          <ShareBar story={story} />
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-rule py-8 no-print" aria-label="सम्बन्धित समाचार">
          <div className="mx-auto max-w-[1180px] px-4">
            <SectionHeader title="यस विषयमा थप" link={`/${story.desk}`} linkLabel={`सबै ${deskInfo?.nameNe}`} />
            <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((s) => (
                <article key={s.slug} className="group">
                  <Kicker desk={s.desk} />
                  <a href={storyUrl(s)} className="block">
                    <div className="mt-1.5">
                      <HeroImage story={s} ratio="aspect-[16/10]" rounded="rounded-sm" sizes="(max-width: 640px) 100vw, 25vw" />
                      <h3 className="headline-card mt-2 text-[16.5px] text-ink group-hover:text-crimson transition-colors">
                        {s.titleNe}
                      </h3>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reader comments */}
      <CommentsSection storyKey={storyKey} />
    </main>
  )
}
