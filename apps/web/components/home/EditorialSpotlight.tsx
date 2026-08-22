import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel, Dateline, SectionHeader } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

type EditorialSpotlightProps = {
  locale: Locale
  diaspora?: StoryCardData | null
  photoStory?: StoryCardData | null
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

function validImage(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')
}

function DiasporaFeature({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const lang = langFor(story, locale)
  const deck = deckFor(story, locale)
  const showPhoto = validImage(story)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group flex h-full min-w-0 flex-col bg-brand-tint/35">
        {showPhoto ? (
          <Link
            href={href}
            className="relative block aspect-[16/9] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={story.heroImage!.url}
              alt={story.heroImage!.alt}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.02]"
            />
          </Link>
        ) : null}

        <div className="flex flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <h3
            className="mt-2 text-balance font-display text-[1.55rem] font-extrabold leading-[1.2] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-[1.9rem]"
            lang={lang}
          >
            <Link href={href}>{titleFor(story, locale)}</Link>
          </h3>
          {deck ? (
            <p className="mt-2 line-clamp-3 text-body leading-relaxed text-ink-soft" lang={lang}>
              {deck}
            </p>
          ) : null}
          <Dateline
            iso={story.publishedAt}
            locale={locale}
            className="mt-auto pt-3 text-caption text-mute"
          />
        </div>
      </article>
    </InstrumentedStory>
  )
}

function PhotoFeature({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const href = hrefFor(story, locale)
  const lang = langFor(story, locale)
  const deck = deckFor(story, locale)
  const showPhoto = validImage(story)

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group flex h-full min-w-0 flex-col bg-chrome text-on-chrome">
        {showPhoto ? (
          <Link
            href={href}
            className="relative block aspect-[3/2] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={story.heroImage!.url}
              alt={story.heroImage!.alt}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.02]"
            />
          </Link>
        ) : null}

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <CategoryLabel
            category={story.category}
            locale={locale}
            as="span"
            className="!text-brand"
          />
          <h3
            className="mt-2 text-balance font-display text-[1.65rem] font-extrabold leading-[1.2] text-on-chrome transition-colors duration-fast ease-out-quint group-hover:text-brand sm:text-[2.05rem]"
            lang={lang}
          >
            <Link href={href}>{titleFor(story, locale)}</Link>
          </h3>
          {deck ? (
            <p
              className="mt-2 line-clamp-2 text-body leading-relaxed text-on-chrome-soft"
              lang={lang}
            >
              {deck}
            </p>
          ) : null}
          <Dateline
            iso={story.publishedAt}
            locale={locale}
            className="mt-3 block text-caption text-on-chrome-soft"
          />
        </div>
      </article>
    </InstrumentedStory>
  )
}

export function EditorialSpotlight({ locale, diaspora, photoStory }: EditorialSpotlightProps) {
  if (!diaspora && !photoStory) return null

  return (
    <section className="mt-8 sm:mt-10" aria-labelledby="home-special-title">
      <SectionHeader
        id="home-special-title"
        title={locale === 'en' ? 'Worth your time' : 'विशेष छनोट'}
        locale={locale}
      />

      <div
        className={`mt-4 grid gap-4 sm:gap-5 ${
          diaspora && photoStory ? 'lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]' : ''
        }`}
      >
        {diaspora ? <DiasporaFeature story={diaspora} locale={locale} /> : null}
        {photoStory ? <PhotoFeature story={photoStory} locale={locale} /> : null}
      </div>
    </section>
  )
}
