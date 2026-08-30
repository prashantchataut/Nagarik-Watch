'use client'

import type { Story } from '@/lib/news/data'
import { desks } from '@/lib/news/data'
import { heroFor } from '@/lib/news/photos'
import { href } from '@/lib/news/router'
import { deskName, timeAgoNe } from '@/lib/news/utils'
import { toDevanagari } from '@/lib/news/patro'

export function Kicker({ desk }: { desk: string }) {
  return (
    <a
      href={href(`/${desk}`)}
      className="kicker hover:underline underline-offset-4"
      onClick={(e) => e.stopPropagation()}
    >
      {deskName(desk)}
    </a>
  )
}

export function MetaLine({ story, showTime = true }: { story: Story; showTime?: boolean }) {
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-ink-faint">
      <span>{story.author}</span>
      {showTime && (
        <>
          <span aria-hidden="true">·</span>
          <time dateTime={story.publishedAt}>{timeAgoNe(story.publishedAt)}</time>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span>{toDevanagari(story.readingMinutes)} मिनेट पढाइ</span>
    </p>
  )
}

/** Branded hero (photo or editorial SVG card) with fixed aspect. */
export function HeroImage({
  story,
  ratio = 'aspect-[16/9]',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  rounded = '',
}: {
  story: Story
  ratio?: string
  sizes?: string
  priority?: boolean
  rounded?: string
}) {
  const src = heroFor(story.slug, story.hero, story.desk)
  const isSvg = src.startsWith('data:image/svg')
  return (
    <div className={`relative overflow-hidden bg-crimson-wash ${ratio} ${rounded}`}>
      <img
        src={src}
        alt={story.heroCaption || story.titleNe}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        className={`size-full object-cover transition-transform duration-500 ${
          isSvg ? '' : 'hover:scale-[1.03]'
        }`}
      />
    </div>
  )
}

/** Photo card: image over, headline under (photo desks). Kicker sits outside the story link. */
export function PhotoCard({ story, priority }: { story: Story; priority?: boolean }) {
  return (
    <article className="group">
      <Kicker desk={story.desk} />
      <a href={href(`/${story.desk}/${story.slug}`)} className="block">
        <HeroImage
          story={story}
          priority={priority}
          ratio="aspect-[3/2]"
          rounded="rounded-sm"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <h3 className="headline-card mt-1 text-[18px] text-ink group-hover:text-crimson transition-colors">
          {story.titleNe}
        </h3>
        <MetaLine story={story} />
      </a>
    </article>
  )
}

/** Horizontal text card: thumb right, headline left (news desks). */
export function RowCard({ story, showDeck = true }: { story: Story; showDeck?: boolean }) {
  return (
    <article className="group flex gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <Kicker desk={story.desk} />
        <a href={href(`/${story.desk}/${story.slug}`)} className="block">
          <h3 className="headline-card mt-1 text-[16.5px] leading-snug text-ink group-hover:text-crimson transition-colors">
            {story.titleNe}
          </h3>
          {showDeck && (
            <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">
              {story.deckNe}
            </p>
          )}
          <MetaLine story={story} />
        </a>
      </div>
      <a
        href={href(`/${story.desk}/${story.slug}`)}
        className="hidden shrink-0 sm:block"
        aria-hidden="true"
        tabIndex={-1}
      >
        <HeroImage story={story} ratio="aspect-square size-[104px]" rounded="rounded-sm" sizes="104px" />
      </a>
    </article>
  )
}

/** Dense latest-rail item: crimson index numeral + timestamp. */
export function LatestItem({ story, index }: { story: Story; index: number }) {
  return (
    <article className="group flex gap-3.5 border-b border-rule py-3 first:pt-0 last:border-b-0">
      <span className="font-headline text-[22px] font-extrabold leading-none text-crimson/85 tabular-nums">
        {toDevanagari(String(index + 1).padStart(2, '0'))}
      </span>
      <div className="min-w-0">
        <a href={href(`/${story.desk}/${story.slug}`)} className="block">
          <h3 className="headline-card text-[16px] leading-snug text-ink group-hover:text-crimson transition-colors">
            {story.titleNe}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-ink-faint">
            {deskName(story.desk)} · <time dateTime={story.publishedAt}>{timeAgoNe(story.publishedAt)}</time>
          </p>
        </a>
      </div>
    </article>
  )
}

/** Voice card: pull-quote typography for opinion/literature desks. */
export function VoiceCard({ story }: { story: Story }) {
  return (
    <article className="group flex h-full flex-col border-l-[3px] border-crimson/70 bg-surface p-4">
      <Kicker desk={story.desk} />
      <a href={href(`/${story.desk}/${story.slug}`)} className="flex h-full flex-col">
        <h3 className="headline-card mt-1.5 text-[18px] text-ink group-hover:text-crimson transition-colors">
          {story.titleNe}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 border-l-2 border-rule pl-3 text-[14.5px] italic leading-relaxed text-ink-soft">
          “{story.deckNe}”
        </p>
        <MetaLine story={story} showTime={false} />
      </a>
    </article>
  )
}

export function SectionHeader({
  title,
  link,
  linkLabel = 'सबै हेर्नुहोस्',
}: {
  title: string
  link?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 border-b-2 border-ink pb-2">
      <h2 className="font-headline text-[22px] font-extrabold text-ink md:text-[26px]">
        {title}
      </h2>
      {link && (
        <a
          href={href(link)}
          className="shrink-0 font-headline text-[13px] font-bold text-crimson hover:underline underline-offset-4"
        >
          {linkLabel} →
        </a>
      )}
    </div>
  )
}

export { desks }
