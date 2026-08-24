import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel, Dateline } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

type MegaStoryBlockProps = {
  story: StoryCardData
  locale: Locale
  priority?: boolean
  size?: 'lead' | 'standard'
  className?: string
}

function storyTitle(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function storyDeck(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function storyLang(story: StoryCardData, locale: Locale): 'en' | 'ne' {
  return locale === 'en' && story.titleEn ? 'en' : 'ne'
}

export function MegaStoryBlock({
  story,
  locale,
  priority = false,
  size = 'lead',
  className = '',
}: MegaStoryBlockProps) {
  const title = storyTitle(story, locale)
  const deck = storyDeck(story, locale)
  const titleLang = storyLang(story, locale)
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
  const image = story.heroImage
  const showPhoto = Boolean(image?.url) && !image!.url.startsWith('data:')
  const lead = size === 'lead'
  const author = story.authors[0]
  const byline = author?.name || story.byline || (locale === 'en' ? 'Nagarik Watch' : 'नागरिक वाच')

  const headline = priority ? (
    <h1
      className={`text-balance font-display font-black text-ink ${
        lead ? 'text-[clamp(1.9rem,3.4vw,2.9rem)]' : 'text-[clamp(1.7rem,3vw,2.4rem)]'
      } ${titleLang === 'en' ? 'leading-[1.1] tracking-[-0.01em]' : 'leading-[1.22] tracking-normal'}`}
      lang={titleLang}
    >
      <Link
        href={href}
        className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {title}
      </Link>
    </h1>
  ) : (
    <h2
      className={`text-balance font-display font-black text-ink ${
        lead ? 'text-[clamp(1.9rem,3.4vw,2.9rem)]' : 'text-[clamp(1.7rem,3vw,2.4rem)]'
      } ${titleLang === 'en' ? 'leading-[1.1] tracking-[-0.01em]' : 'leading-[1.22] tracking-normal'}`}
      lang={titleLang}
    >
      <Link
        href={href}
        className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {title}
      </Link>
    </h2>
  )

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className={`group min-w-0 ${className}`.trim()}>
        {showPhoto ? (
          <Link
            href={href}
            className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 780px, (min-width: 1024px) 60vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
            />
          </Link>
        ) : null}

        <div className="py-3.5 sm:py-4">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <div className="mt-1.5">{headline}</div>

          {deck ? (
            <p
              className="mt-2 max-w-[52rem] text-pretty text-body leading-[1.6] text-ink-soft"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-soft">
            {author ? (
              <Link
                href={localizeHref(locale, `/author/${author.slug}`)}
                className="font-bold text-ink hover:text-brand-strong hover:underline"
                lang={titleLang}
              >
                {author.name}
              </Link>
            ) : (
              <span className="font-bold text-ink" lang={titleLang}>
                {byline}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <Dateline iso={story.publishedAt} locale={locale} />
          </div>
        </div>
      </article>
    </InstrumentedStory>
  )
}
