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
        className="object-cover object-center transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.02]"
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
      <article
        className={`group min-w-0 text-start ${
          photo
            ? 'grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] sm:items-start sm:gap-4 lg:gap-5'
            : ''
        }`}
        data-home-role="lead"
      >
        {photo ? (
          <StoryMedia
            story={story}
            locale={locale}
            priority
            sizes="(min-width: 1280px) 520px, (min-width: 640px) 52vw, 100vw"
            className="aspect-[3/2]"
          />
        ) : (
          <div className="h-0.5 w-16 bg-brand" aria-hidden="true" />
        )}

        <div className="min-w-0">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h1
            className="mt-1.5 text-pretty font-display text-[1.45rem] font-black leading-[1.22] text-ink sm:text-[1.7rem] sm:leading-[1.2] lg:text-[1.95rem]"
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
              className="mt-2 text-pretty text-body leading-relaxed text-ink-soft line-clamp-3 sm:line-clamp-4"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}

          <Byline
            authors={story.authors}
            locale={locale}
            publishedAt={story.publishedAt}
            className="mt-2.5"
          />
        </div>
      </article>
    </InstrumentedStory>
  )
}

function SupportStory({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const title = titleFor(story, locale)
  const titleLang = langFor(story, locale)
  const photo = hasPhoto(story)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article
        className={`group min-w-0 text-start ${
          photo ? 'grid grid-cols-[5.75rem_minmax(0,1fr)] gap-2.5 sm:grid-cols-1 sm:gap-0' : ''
        }`}
        data-home-role="support"
      >
        {photo ? (
          <StoryMedia
            story={story}
            locale={locale}
            sizes="(min-width: 640px) 360px, 96px"
            className="aspect-[3/2] sm:mb-2"
          />
        ) : null}
        <div className="min-w-0">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h2
            className="mt-1 text-pretty font-display text-[1.02rem] font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-[1.12rem]"
            lang={titleLang}
          >
            <Link
              href={hrefFor(story, locale)}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span className="line-clamp-3">{title}</span>
            </Link>
          </h2>
          <div className="mt-1.5 text-caption text-mute">
            <Dateline iso={story.publishedAt} locale={locale} />
          </div>
        </div>
      </article>
    </InstrumentedStory>
  )
}

/**
 * THESIS: first viewport is a packed news desk, photo then type, never a centered void.
 * OWN-WORLD: Civic Crimson kickers, Mukta headlines, 3:2 photography, hairline rules.
 * STORY: scan the lead, two supports, and a pulse of briefs in one pass.
 * FIRST VIEWPORT: 3:2 lead, left-aligned display, 2-up supports, 4-brief pulse.
 * FORM: Nepali portal packing, Civic Crimson identity.
 */
export function LeadPackage({ stories, locale }: LeadPackageProps) {
  if (stories.length === 0) return null

  const english = locale === 'en'
  const lead = stories[0]!
  const support = stories.slice(1, 3)
  const pulse = stories.slice(3, 7)

  return (
    <section
      className="border-b border-rule pb-4 text-start sm:pb-5"
      aria-label={english ? 'Top stories' : 'मुख्य समाचार'}
      data-home-lead-package
    >
      <PrimaryLead story={lead} locale={locale} />

      {support.length > 0 ? (
        <div
          className={`mt-4 grid gap-3.5 border-t border-rule pt-4 ${
            support.length > 1 ? 'sm:grid-cols-2 sm:gap-4' : ''
          }`}
        >
          {support.map((story) => (
            <SupportStory key={story.id} story={story} locale={locale} />
          ))}
        </div>
      ) : null}

      {pulse.length > 0 ? (
        <div className="mt-4 border-t border-rule pt-1">
          <h2 className="sr-only">{english ? 'More top stories' : 'थप मुख्य समाचार'}</h2>
          <ol
            className={`grid divide-y divide-rule ${
              pulse.length > 1
                ? 'sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:divide-rule'
                : ''
            } ${pulse.length > 2 ? 'lg:grid-cols-4' : ''}`}
          >
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
