import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

type CategoryMoreStoriesProps = {
  stories: StoryCardData[]
  locale: Locale
  heading?: { ne: string; en: string }
  kicker?: { ne: string; en: string }
  description?: { ne: string; en: string }
}

function titleFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function realPhoto(story: StoryCardData) {
  const url = story.heroImage?.url
  return url && !url.startsWith('data:') ? url : null
}

/**
 * Editorial continuation for category/topic/province indexes.
 *
 * There is deliberately no list/grid switch. A news desk should establish hierarchy,
 * not ask readers to choose a rendering mode. Stories are paced in chapters: one anchor
 * with context, then supporting dispatches. This preserves scan speed without becoming a
 * wall of interchangeable cards or headline-only rows.
 */
export function CategoryMoreStories({
  stories,
  locale,
  heading,
  kicker,
  description,
}: CategoryMoreStoriesProps) {
  if (!stories.length) return null

  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const title = heading
    ? english
      ? heading.en
      : heading.ne
    : english
      ? 'Continue reading'
      : 'थप पढ्नुहोस्'

  const kickerText = kicker
    ? english
      ? kicker.en
      : kicker.ne
    : english
      ? 'Desk file'
      : 'डेस्क फाइल'
  const descriptionText = description
    ? english
      ? description.en
      : description.ne
    : english
      ? 'Lead developments first, then supporting reporting and briefs.'
      : 'पहिला मुख्य विकास, त्यसपछि सम्बन्धित रिपोर्टिङ र छोटा अपडेट।'

  const chapters: StoryCardData[][] = []
  for (let i = 0; i < stories.length; i += 5) chapters.push(stories.slice(i, i + 5))

  return (
    <section aria-labelledby="category-more-heading" className="pt-1">
      <header className="flex items-end justify-between gap-4 border-b border-rule pb-2.5">
        <div className="min-w-0">
          <p className="text-caption font-bold text-brand-strong" lang={lang}>
            {kickerText}
          </p>
          <h2
            id="category-more-heading"
            className="mt-0.5 font-display text-h2 font-extrabold text-ink"
            lang={lang}
          >
            {title}
          </h2>
        </div>
        <p
          className="hidden max-w-sm text-right text-caption leading-relaxed text-mute md:block"
          lang={lang}
        >
          {descriptionText}
        </p>
      </header>

      <div className="divide-y divide-rule">
        {chapters.map((chapter, chapterIndex) => (
          <StoryChapter
            key={chapter.map((story) => story.id).join(':')}
            stories={chapter}
            locale={locale}
            chapterIndex={chapterIndex}
          />
        ))}
      </div>
    </section>
  )
}

function StoryChapter({
  stories,
  locale,
  chapterIndex,
}: {
  stories: StoryCardData[]
  locale: Locale
  chapterIndex: number
}) {
  const [anchor, ...support] = stories
  if (!anchor) return null
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const anchorTitle = titleFor(anchor, locale)
  const anchorDeck = deckFor(anchor, locale)
  const href = localizeHref(locale, `/${anchor.category.slug}/${anchor.slug}`)
  const image = realPhoto(anchor)

  return (
    <div className="grid gap-4 py-5 lg:grid-cols-12 lg:gap-6 lg:py-6">
      <div className="min-w-0 lg:col-span-7">
        <InstrumentedStory articleSlug={anchor.slug} articleCategory={anchor.category.slug}>
          <article className="group grid gap-3 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] sm:items-start sm:gap-4">
            {image ? (
              <Link
                href={href}
                tabIndex={-1}
                aria-hidden="true"
                className="relative block aspect-[16/10] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 34vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
                />
              </Link>
            ) : null}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-caption font-black tabular-nums text-mute" aria-hidden="true">
                  {String(chapterIndex + 1).padStart(2, '0')}
                </span>
                <CategoryLabel category={anchor.category} locale={locale} as="span" />
              </div>
              <h3
                className="mt-2 text-pretty font-display text-[clamp(1.35rem,2.4vw,2rem)] font-extrabold leading-[1.18] text-ink transition-colors group-hover:text-brand-strong"
                lang={lang}
              >
                <Link
                  href={href}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {anchorTitle}
                </Link>
              </h3>
              {anchorDeck ? (
                <p
                  className="mt-2 line-clamp-3 text-body leading-relaxed text-ink-soft"
                  lang={lang}
                >
                  {anchorDeck}
                </p>
              ) : null}
            </div>
          </article>
        </InstrumentedStory>
      </div>

      {support.length > 0 ? (
        <ol className="min-w-0 border-t border-rule lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-5">
          {support.map((story, index) => (
            <li key={story.id} className="border-b border-rule py-3 last:border-b-0 lg:first:pt-0">
              <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2.5">
                <span
                  className="pt-0.5 text-caption font-black tabular-nums text-brand-strong"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem
                    story={story}
                    locale={locale}
                    thumb={index < 2 ? 'sm' : 'none'}
                    showDeck={index === 0}
                    showMeta={index < 2}
                  />
                </InstrumentedStory>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
