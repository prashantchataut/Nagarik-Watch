import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel, Dateline } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'
import { MegaStoryBlock } from '@/components/home/MegaStoryBlock'

type PortalFeedProps = {
  stories: StoryCardData[]
  locale: Locale
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function langFor(story: StoryCardData, locale: Locale): 'en' | 'ne' {
  return locale === 'en' && story.titleEn ? 'en' : 'ne'
}

function hrefFor(story: StoryCardData, locale: Locale): string {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

function PortalFeature({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const image = story.heroImage
  const showPhoto = Boolean(image?.url) && !image!.url.startsWith('data:')
  const deck = deckFor(story, locale)
  const lang = langFor(story, locale)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group min-w-0 text-center">
        <CategoryLabel category={story.category} locale={locale} as="span" />
        <h2
          className="mx-auto mt-2 max-w-[24ch] text-balance font-display text-[clamp(1.7rem,3.2vw,2.35rem)] font-black leading-[1.18] tracking-[-0.02em] text-ink"
          lang={lang}
        >
          <Link
            href={href}
            className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {titleFor(story, locale)}
          </Link>
        </h2>

        <Dateline
          iso={story.publishedAt}
          locale={locale}
          className="mt-2 block text-caption text-mute"
        />

        {showPhoto ? (
          <Link
            href={href}
            className="relative mt-3 block aspect-[3/2] overflow-hidden bg-surface-raised text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
            />
          </Link>
        ) : deck ? (
          <p
            className="mx-auto mt-3 max-w-[42rem] text-body leading-relaxed text-ink-soft"
            lang={lang}
          >
            {deck}
          </p>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}

function PortalPick({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const image = story.heroImage
  const showPhoto = Boolean(image?.url) && !image!.url.startsWith('data:')
  const deck = deckFor(story, locale)
  const lang = langFor(story, locale)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
        {showPhoto ? (
          <Link
            href={href}
            className="relative aspect-[3/2] overflow-hidden bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              sizes="112px"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.02]"
            />
          </Link>
        ) : (
          <span
            className="flex aspect-[3/2] items-center justify-center bg-brand-tint px-2 text-center font-display text-caption font-extrabold text-brand-strong"
            lang={lang}
          >
            {locale === 'en' ? 'Top story' : 'मुख्य'}
          </span>
        )}

        <div className="min-w-0">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h3
            className="mt-1 text-pretty font-display text-body font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-body-lg"
            lang={lang}
          >
            <Link href={href}>{titleFor(story, locale)}</Link>
          </h3>
          {deck ? (
            <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-soft" lang={lang}>
              {deck}
            </p>
          ) : null}
        </div>
      </article>
    </InstrumentedStory>
  )
}

export function PortalFeed({ stories, locale }: PortalFeedProps) {
  const unique = Array.from(new Map(stories.map((story) => [story.id, story])).values()).slice(0, 5)
  if (unique.length === 0) return null

  const lead = unique[0]!
  const supporting = unique.slice(1, 3)
  const picks = unique.slice(3, 5)

  return (
    <section aria-label={locale === 'en' ? 'Top stories' : 'मुख्य समाचार'}>
      <MegaStoryBlock story={lead} locale={locale} priority size="lead" className="pt-2 sm:pt-3" />

      {supporting.length > 0 ? (
        <div
          className={`mt-6 grid gap-7 lg:mt-8 ${
            supporting.length > 1 ? 'md:grid-cols-2 md:gap-5 lg:gap-8' : ''
          }`}
        >
          {supporting.map((story) => (
            <PortalFeature key={story.id} story={story} locale={locale} />
          ))}
        </div>
      ) : null}

      {picks.length > 0 ? (
        <div
          className={`mt-6 grid gap-4 bg-surface-raised px-3 py-4 sm:px-4 lg:mt-8 ${
            picks.length > 1 ? 'sm:grid-cols-2 sm:gap-5' : ''
          }`}
        >
          {picks.map((story) => (
            <PortalPick key={story.id} story={story} locale={locale} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
