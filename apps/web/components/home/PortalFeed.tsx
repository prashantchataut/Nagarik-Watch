import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel, Dateline } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'
import { MegaStoryBlock } from '@/components/home/MegaStoryBlock'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type PortalFeedProps = {
  stories: StoryCardData[]
  /**
   * The ताजा rail beside the lead. This is where the opening gets its density
   * (DESIGN.md §5): the lead carries hierarchy, the rail carries the headline
   * count that decides whether a reader believes we have the news.
   */
  rail?: StoryCardData[]
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
              sizes="(min-width: 1024px) 33vw, 50vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
            />
          </Link>
        ) : null}
        <div className="pt-2.5">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h2
            className="mt-1 text-pretty font-display text-[clamp(1.12rem,1.5vw,1.3rem)] font-extrabold leading-[1.28] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
            lang={lang}
          >
            <Link href={href}>{titleFor(story, locale)}</Link>
          </h2>
          {deck ? (
            <p className="mt-1.5 line-clamp-2 text-meta leading-[1.6] text-ink-soft" lang={lang}>
              {deck}
            </p>
          ) : null}
          <Dateline
            iso={story.publishedAt}
            locale={locale}
            className="mt-1.5 block text-caption text-mute"
          />
        </div>
      </article>
    </InstrumentedStory>
  )
}

export function PortalFeed({ stories, rail = [], locale }: PortalFeedProps) {
  const unique = Array.from(new Map(stories.map((story) => [story.id, story])).values()).slice(0, 5)
  if (unique.length === 0) return null

  const lead = unique[0]!
  // Everything after the lead becomes a photo card row. The old split — two
  // large "supporting" features plus two text-only "picks" — spent a full
  // screen on four stories; one even row of four reads faster and packs denser.
  const supporting = unique.slice(1, 5)

  const seen = new Set(unique.map((story) => story.id))
  const railStories = rail.filter((story) => !seen.has(story.id)).slice(0, 7)

  return (
    <section aria-label={locale === 'en' ? 'Top stories' : 'मुख्य समाचार'} className="home-opening">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <MegaStoryBlock story={lead} locale={locale} priority size="lead" />
        </div>

        {railStories.length > 0 ? (
          <aside
            aria-label={locale === 'en' ? 'Latest' : 'ताजा समाचार'}
            className="min-w-0 border-t border-rule pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-body-lg font-extrabold text-ink">
                {locale === 'en' ? 'Latest' : 'ताजा'}
              </h2>
              <Link
                href={localizeHref(locale, '/latest')}
                className="inline-flex min-h-6 items-center text-caption font-bold text-brand-strong hover:underline"
              >
                {locale === 'en' ? 'All →' : 'सबै →'}
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-rule">
              {railStories.map((story) => (
                <li key={story.id} className="py-2.5 first:pt-0 last:pb-0">
                  <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                    <DenseStoryItem
                      story={story}
                      locale={locale}
                      compact
                      showDeck={false}
                      thumb="none"
                    />
                  </InstrumentedStory>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>

      {supporting.length > 0 ? (
        <div className="mt-6 grid gap-5 border-t border-rule pt-6 sm:mt-7 sm:grid-cols-2 sm:pt-7 lg:grid-cols-4 lg:gap-6">
          {supporting.map((story) => (
            <PortalFeature key={story.id} story={story} locale={locale} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
