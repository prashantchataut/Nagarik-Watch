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

function PortalPick({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const image = story.heroImage
  const showPhoto = Boolean(image?.url) && !image!.url.startsWith('data:')
  const deck = deckFor(story, locale)
  const lang = langFor(story, locale)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group min-w-0 py-4 sm:py-5">
        {showPhoto ? (
          <Link
            href={href}
            className="relative mb-3 block aspect-[16/10] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
            />
          </Link>
        ) : null}
        <CategoryLabel category={story.category} locale={locale} as="span" />
        <h2
          className="mt-1.5 text-pretty font-display text-[1.35rem] font-extrabold leading-[1.25] text-ink sm:text-[1.65rem]"
          lang={lang}
        >
          <Link
            href={href}
            className="transition-colors duration-fast ease-out-quint hover:text-brand-strong"
          >
            {titleFor(story, locale)}
          </Link>
        </h2>
        {!showPhoto && deck ? (
          <p className="mt-2 line-clamp-3 text-meta leading-relaxed text-ink-soft" lang={lang}>
            {deck}
          </p>
        ) : null}
        <Dateline
          iso={story.publishedAt}
          locale={locale}
          className="mt-2 block text-caption text-mute"
        />
      </article>
    </InstrumentedStory>
  )
}

export function PortalFeed({ stories, locale }: PortalFeedProps) {
  const unique = Array.from(new Map(stories.map((story) => [story.id, story])).values()).slice(0, 5)
  if (unique.length === 0) return null

  const megaStories = unique.slice(0, 3)
  const picks = unique.slice(3, 5)

  return (
    <section aria-label={locale === 'en' ? 'Top stories' : 'मुख्य समाचार'}>
      <div>
        {megaStories.map((story, index) => (
          <MegaStoryBlock
            key={story.id}
            story={story}
            locale={locale}
            priority={index === 0}
            size={index === 0 ? 'lead' : 'standard'}
            className={index === 0 ? 'pt-2 sm:pt-3' : ''}
          />
        ))}
      </div>

      {picks.length > 0 ? (
        <div className="grid border-b border-rule sm:grid-cols-2">
          {picks.map((story, index) => (
            <div
              key={story.id}
              className={index > 0 ? 'border-t border-rule sm:border-l sm:border-t-0 sm:pl-5' : 'sm:pr-5'}
            >
              <PortalPick story={story} locale={locale} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
