import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel, Dateline } from '@nagarikwatch/ui'
import { MegaStoryBlock } from '@/components/home/MegaStoryBlock'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

type PortalFeedProps = {
  stories: StoryCardData[]
  locale: Locale
}

function titleFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function langFor(story: StoryCardData, locale: Locale): 'ne' | 'en' {
  return locale === 'en' && story.titleEn ? 'en' : 'ne'
}

function hrefFor(story: StoryCardData, locale: Locale) {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

function RailFeature({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const image = story.heroImage
  const showPhoto = Boolean(image?.url) && !image!.url.startsWith('data:')
  const deck = deckFor(story, locale)
  const lang = langFor(story, locale)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group min-w-0 pb-5">
        {showPhoto ? (
          <Link
            href={href}
            className="relative mb-3 block aspect-[3/2] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              sizes="(min-width: 1024px) 320px, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
            />
          </Link>
        ) : null}
        <CategoryLabel category={story.category} locale={locale} as="span" />
        <h2 className="mt-1.5 text-pretty font-display text-[1.55rem] font-black leading-[1.18] text-ink" lang={lang}>
          <Link href={href} className="hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            {titleFor(story, locale)}
          </Link>
        </h2>
        {deck ? (
          <p className="mt-1.5 line-clamp-3 text-meta leading-relaxed text-ink-soft" lang={lang}>
            {deck}
          </p>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}

function RailStory({ story, locale, rank }: { story: StoryCardData; locale: Locale; rank: number }) {
  const href = hrefFor(story, locale)
  const lang = langFor(story, locale)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-t border-rule py-3.5">
        <span className="font-sans text-[0.82rem] font-black tabular-nums text-brand-strong" aria-hidden="true">
          {String(rank).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <h3 className="text-pretty font-display text-body-lg font-extrabold leading-[1.28] text-ink" lang={lang}>
            <Link href={href} className="hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              {titleFor(story, locale)}
            </Link>
          </h3>
          <Dateline iso={story.publishedAt} locale={locale} className="mt-1 block text-caption text-mute" />
        </div>
      </article>
    </InstrumentedStory>
  )
}

export function PortalFeed({ stories, locale }: PortalFeedProps) {
  const unique = Array.from(new Map(stories.map((story) => [story.id, story])).values()).slice(0, 5)
  if (unique.length === 0) return null

  const lead = unique[0]!
  const railLead = unique[1]
  const railStories = unique.slice(2)
  const en = locale === 'en'

  return (
    <section aria-label={en ? 'Top stories' : 'मुख्य समाचार'} className="pt-1 sm:pt-2">
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1.72fr)_minmax(18rem,0.68fr)] lg:gap-8 xl:gap-10">
        <MegaStoryBlock story={lead} locale={locale} priority size="lead" />

        {(railLead || railStories.length > 0) ? (
          <aside className="min-w-0 border-t border-rule pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-rule pb-2.5">
              <h2 className="font-display text-h3 font-black text-ink" lang={en ? 'en' : 'ne'}>
                {en ? 'Today' : 'आजका मुख्य'}
              </h2>
              <Link
                href={localizeHref(locale, '/latest')}
                className="text-caption font-bold text-brand-strong hover:underline"
                lang={en ? 'en' : 'ne'}
              >
                {en ? 'All latest' : 'सबै ताजा'}
              </Link>
            </div>
            {railLead ? <RailFeature story={railLead} locale={locale} /> : null}
            <div>
              {railStories.map((story, index) => (
                <RailStory key={story.id} story={story} locale={locale} rank={index + 2} />
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
