import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Byline, CategoryLabel, Dateline } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

type LeadPackageProps = {
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

function hasPhoto(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')
}

function StoryMedia({
  story,
  locale,
  priority = false,
  sizes,
  className,
}: {
  story: StoryCardData
  locale: Locale
  priority?: boolean
  sizes: string
  className: string
}) {
  if (!hasPhoto(story)) return null
  return (
    <Link
      href={hrefFor(story, locale)}
      className={`relative block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      tabIndex={-1}
      aria-hidden="true"
    >
      <Image
        src={story.heroImage!.url}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.02]"
      />
    </Link>
  )
}

function PrimaryLead({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const title = titleFor(story, locale)
  const deck = deckFor(story, locale)
  const titleLang = langFor(story, locale)
  const photo = hasPhoto(story)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group min-w-0" data-home-role="lead">
        {photo ? (
          <StoryMedia
            story={story}
            locale={locale}
            priority
            sizes="(min-width: 1280px) 820px, (min-width: 1024px) 64vw, 100vw"
            className="aspect-[16/10] sm:aspect-[16/9]"
          />
        ) : null}

        <div className={photo ? 'mt-3 sm:mt-3.5' : 'border-t-2 border-brand pt-3'}>
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h1
            className="mt-1.5 text-pretty font-display text-[1.85rem] font-black leading-[1.18] text-ink sm:text-[2.35rem] sm:leading-[1.14] lg:text-[2.85rem] xl:text-[3rem]"
            lang={titleLang}
          >
            <Link
              href={hrefFor(story, locale)}
              className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {title}
            </Link>
          </h1>

          {deck ? (
            <p
              className="mt-2 max-w-[42rem] text-pretty text-body leading-relaxed text-ink-soft line-clamp-3 sm:mt-2.5 sm:text-body-lg sm:leading-relaxed"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}

          <Byline
            authors={story.authors}
            locale={locale}
            publishedAt={story.publishedAt}
            className="mt-2 sm:mt-2.5"
          />
        </div>
      </article>
    </InstrumentedStory>
  )
}

function SupportLead({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const title = titleFor(story, locale)
  const deck = deckFor(story, locale)
  const titleLang = langFor(story, locale)
  const photo = hasPhoto(story)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article
        className={`group min-w-0 ${
          photo
            ? 'grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] lg:grid-cols-1'
            : ''
        }`}
        data-home-role="support"
      >
        {photo ? (
          <StoryMedia
            story={story}
            locale={locale}
            sizes="(min-width: 1024px) 360px, 120px"
            className="aspect-[4/3] lg:aspect-[16/10]"
          />
        ) : null}

        <div className={photo ? 'min-w-0 lg:mt-2.5' : 'min-w-0'}>
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h2
            className="mt-1 text-pretty font-display text-h3 font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-[1.35rem] lg:text-[1.5rem]"
            lang={titleLang}
          >
            <Link
              href={hrefFor(story, locale)}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {title}
            </Link>
          </h2>
          {deck ? (
            <p
              className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-soft sm:text-meta"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}
          <div className="mt-1.5 text-caption text-mute">
            <Dateline iso={story.publishedAt} locale={locale} />
          </div>
        </div>
      </article>
    </InstrumentedStory>
  )
}

/**
 * Homepage opening hierarchy: one editorial thesis, then distinct support roles.
 * Packed left/right desk, never stacked centered mega voids.
 */
export function LeadPackage({ stories, locale }: LeadPackageProps) {
  if (stories.length === 0) return null

  const english = locale === 'en'
  const lead = stories[0]!
  const support = stories[1]
  const briefs = stories.slice(2, 4)
  const pulse = stories.slice(4, 8)
  const hasSupportColumn = Boolean(support) || briefs.length > 0

  return (
    <section
      className="border-b border-rule pb-4 sm:pb-5 lg:pb-6"
      aria-label={english ? 'Top stories' : 'मुख्य समाचार'}
      data-home-lead-package
    >
      <div
        className={`grid gap-4 sm:gap-5 ${
          hasSupportColumn
            ? 'lg:grid-cols-[minmax(0,1.55fr)_minmax(17rem,1fr)] lg:items-start lg:gap-6 xl:gap-7'
            : ''
        }`}
      >
        <PrimaryLead story={lead} locale={locale} />

        {hasSupportColumn ? (
          <div className="min-w-0 border-t border-rule pt-3.5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0 xl:pl-6">
            {support ? <SupportLead story={support} locale={locale} /> : null}
            {briefs.length > 0 ? (
              <div
                className={`${support ? 'mt-3 border-t border-rule pt-1' : ''} divide-y divide-rule`}
              >
                {briefs.map((story) => (
                  <div key={story.id} className="py-2.5">
                    <InstrumentedStory
                      articleSlug={story.slug}
                      articleCategory={story.category.slug}
                    >
                      <DenseStoryItem
                        story={story}
                        locale={locale}
                        compact
                        showDeck={false}
                        showMeta
                        showDateline
                        thumb="sm"
                      />
                    </InstrumentedStory>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {pulse.length > 0 ? (
        <div className="mt-3.5 border-t border-rule pt-1 sm:mt-4">
          <h2 className="sr-only">{english ? 'More top stories' : 'थप मुख्य समाचार'}</h2>
          <ol className="grid divide-y divide-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:divide-rule lg:grid-cols-4">
            {pulse.map((story, index) => (
              <li
                key={story.id}
                className={`min-w-0 py-2.5 sm:px-3.5 sm:py-3 ${index % 2 === 0 ? 'sm:pl-0' : ''} ${
                  index % 2 === 1 ? 'sm:pr-0 lg:pr-3.5' : ''
                } ${index === 0 ? 'lg:pl-0' : ''} ${index === pulse.length - 1 ? 'lg:pr-0' : ''} ${
                  index >= 2 ? 'sm:border-t sm:border-rule lg:border-t-0' : ''
                }`}
              >
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem
                    story={story}
                    locale={locale}
                    compact
                    showDeck={false}
                    showMeta
                    showDateline
                    thumb="sm"
                  />
                </InstrumentedStory>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
