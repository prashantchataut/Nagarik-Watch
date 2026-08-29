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
      <article className="group min-w-0">
        {showPhoto ? (
          <Link
            href={href}
            className="relative block aspect-[16/9] w-full overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
            />
          </Link>
        ) : null}
        <div className="pt-3">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h2
            className="mt-1.5 text-pretty font-display text-[clamp(1.45rem,2.5vw,2rem)] font-extrabold leading-[1.2] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
            lang={lang}
          >
            <Link href={href}>{titleFor(story, locale)}</Link>
          </h2>
          {deck ? (
            <p className="mt-2 line-clamp-2 text-body leading-[1.65] text-ink-soft" lang={lang}>
              {deck}
            </p>
          ) : null}
          <Dateline iso={story.publishedAt} locale={locale} className="mt-2 block text-caption text-mute" />
        </div>
      </article>
    </InstrumentedStory>
  )
}

function PortalPick({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const deck = deckFor(story, locale)
  const lang = langFor(story, locale)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group min-w-0 border-t border-rule pt-4 sm:border-t-0 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0">
        <CategoryLabel category={story.category} locale={locale} as="span" />
        <h3
          className="mt-1.5 text-pretty font-display text-body-lg font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
          lang={lang}
        >
          <Link href={href}>{titleFor(story, locale)}</Link>
        </h3>
        {deck ? (
          <p className="mt-1.5 line-clamp-2 text-meta leading-relaxed text-ink-soft" lang={lang}>
            {deck}
          </p>
        ) : null}
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
    <section aria-label={locale === 'en' ? 'Top stories' : 'मुख्य समाचार'} className="home-opening">
      <MegaStoryBlock story={lead} locale={locale} priority size="lead" />

      {supporting.length > 0 ? (
        <div className={`mt-7 grid gap-6 border-b border-rule pb-7 sm:mt-9 sm:pb-9 ${supporting.length > 1 ? 'md:grid-cols-2 md:gap-7' : ''}`}>
          {supporting.map((story) => (
            <PortalFeature key={story.id} story={story} locale={locale} />
          ))}
        </div>
      ) : null}

      {picks.length > 0 ? (
        <div className={`mt-5 grid gap-4 sm:mt-6 ${picks.length > 1 ? 'sm:grid-cols-2 sm:gap-0' : ''}`}>
          {picks.map((story) => (
            <PortalPick key={story.id} story={story} locale={locale} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
