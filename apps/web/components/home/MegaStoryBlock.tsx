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
  // `ch` resolves against the element that declares it, so the measure must live on the
  // headline itself. On a bare wrapper it would inherit 16px body text and clamp the
  // display headline to ~164px, towering it into 10+ lines.
  const headlineClass = `text-balance font-display font-black text-ink ${
    lead
      ? 'mx-auto max-w-[19ch] text-[clamp(2.35rem,5.5vw,4.5rem)]'
      : 'max-w-[24ch] text-[clamp(1.85rem,3.4vw,2.8rem)]'
  } ${titleLang === 'en' ? 'leading-[1.02] tracking-[-0.035em]' : 'leading-[1.12] tracking-normal'}`

  const headline = priority ? (
    <h1 className={headlineClass} lang={titleLang}>
      <Link
        href={href}
        className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {title}
      </Link>
    </h1>
  ) : (
    <h2 className={headlineClass} lang={titleLang}>
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
        <div className={lead ? 'mx-auto max-w-[68rem] pb-5 pt-3 text-center sm:pb-7 sm:pt-5' : 'pb-4'}>
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <div className="mt-2">{headline}</div>
          {deck ? (
            <p
              className={
                lead
                  ? 'mx-auto mt-3 max-w-[58rem] text-pretty text-[1.08rem] leading-[1.7] text-ink-soft sm:text-[1.25rem]'
                  : 'mt-2 max-w-[52rem] text-pretty text-body leading-[1.65] text-ink-soft'
              }
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}
          <div className={`mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-soft ${lead ? 'justify-center' : ''}`}>
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

        {showPhoto ? (
          <Link
            href={href}
            className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9] lg:aspect-[2/1]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 1280px, calc(100vw - 2rem)"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.008]"
            />
          </Link>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}
