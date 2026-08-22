import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Byline, CategoryLabel } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { CategoryMoreStories } from '@/components/category/CategoryMoreStories'
import { localizeHref } from '@/lib/i18n/locales'

type CategoryDeskProps = {
  stories: StoryCardData[]
  locale: Locale
  /** Override the “more” section heading (topic / hub). */
  moreHeading?: { ne: string; en: string }
  /** Override the support-band kicker. */
  sideKicker?: { ne: string; en: string }
  /** Optional mid-band (ads) between lead pack and more stories. */
  midSlot?: ReactNode
}

function localizedTitle(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function localizedDeck(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function realPhoto(story: StoryCardData): string | null {
  const url = story.heroImage?.url
  return url && !url.startsWith('data:') ? url : null
}

/**
 * Shared category / topic / hub index composition.
 * One dominant split lead, an asymmetric support band, then an editorial continuation.
 * The layout collapses rather than reserving empty media or rail columns when content is sparse.
 */
export function CategoryDesk({
  stories,
  locale,
  moreHeading,
  sideKicker,
  midSlot,
}: CategoryDeskProps) {
  if (!stories.length) return null

  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const [lead, ...rest] = stories
  if (!lead) return null

  const support = rest.slice(0, 3)
  const more = rest.slice(3)
  const supportLabel =
    sideKicker != null
      ? english
        ? sideKicker.en
        : sideKicker.ne
      : english
        ? 'More from this desk'
        : 'यस डेस्कका थप'

  return (
    <div className="grid gap-5 sm:gap-6">
      <CategoryLead story={lead} locale={locale} />

      {support.length > 0 ? (
        <section aria-label={supportLabel}>
          <div className="mb-2.5" lang={lang}>
            <h2 className="font-display text-body-lg font-extrabold text-ink">{supportLabel}</h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
          </div>
          <ul className="grid border-y border-rule lg:grid-cols-12">
            {support.map((story, index) => (
              <li
                key={story.id}
                className={`min-w-0 py-3 lg:py-3.5 ${
                  index === 0
                    ? 'lg:col-span-5 lg:pr-4'
                    : index === 1
                      ? 'border-t border-rule lg:col-span-4 lg:border-l lg:border-t-0 lg:px-4'
                      : 'border-t border-rule lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-4'
                }`}
              >
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem
                    story={story}
                    locale={locale}
                    thumb={index === 0 ? 'lg' : 'md'}
                    showDeck={index !== 2}
                    showMeta
                  />
                </InstrumentedStory>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {midSlot}

      <CategoryMoreStories stories={more} locale={locale} heading={moreHeading} />
    </div>
  )
}

function CategoryLead({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const english = locale === 'en'
  const title = localizedTitle(story, locale)
  const deck = localizedDeck(story, locale)
  const titleLang = english && story.titleEn ? 'en' : 'ne'
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
  const imageUrl = realPhoto(story)

  return (
    <section
      className="border-b border-rule pb-5 sm:pb-6"
      aria-label={english ? 'Lead story' : 'मुख्य समाचार'}
    >
      <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
        <article
          className={
            imageUrl
              ? 'group grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.82fr)] lg:items-center lg:gap-6'
              : 'group max-w-[52rem]'
          }
        >
          {imageUrl ? (
            <Link
              href={href}
              className="relative block aspect-[16/10] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9]"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Image
                src={imageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 1200px) 700px, (min-width: 1024px) 58vw, 100vw"
                className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
              />
            </Link>
          ) : null}

          <div className="min-w-0">
            <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
            <h2
              className="text-pretty font-display text-[clamp(1.8rem,4.1vw,3.15rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
              lang={titleLang}
            >
              <Link
                href={href}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {title}
              </Link>
            </h2>
            {deck ? (
              <p
                className="mt-2.5 max-w-[42rem] text-pretty text-body leading-relaxed text-ink-soft sm:text-body-lg"
                lang={titleLang}
              >
                {deck}
              </p>
            ) : null}
            <div className="mt-3.5">
              <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
            </div>
          </div>
        </article>
      </InstrumentedStory>
    </section>
  )
}
