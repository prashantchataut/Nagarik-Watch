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
  const headingClass = `${
    lead ? 'text-[clamp(2.45rem,5vw,4.65rem)]' : 'text-[clamp(2rem,3.6vw,3.2rem)]'
  } mt-2.5 max-w-[19ch] text-pretty font-display font-black text-ink ${
    titleLang === 'en' ? 'leading-[1.04] tracking-[-0.03em]' : 'leading-[1.13] tracking-normal'
  }`

  const headline = priority ? (
    <h1 className={headingClass} lang={titleLang}>
      <StoryLink href={href}>{title}</StoryLink>
    </h1>
  ) : (
    <h2 className={headingClass} lang={titleLang}>
      <StoryLink href={href}>{title}</StoryLink>
    </h2>
  )

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className={`group min-w-0 ${className}`.trim()}>
        <div className={lead ? 'max-w-[58rem] pb-4 sm:pb-5' : 'max-w-[48rem] pb-4'}>
          <CategoryLabel category={story.category} locale={locale} as="span" />
          {headline}

          {deck ? (
            <p
              className="mt-3 max-w-[44rem] text-pretty text-body leading-[1.7] text-ink-soft sm:text-body-lg"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-soft">
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
            className={`relative block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              lead ? 'aspect-[16/9] min-h-[16rem] sm:min-h-[24rem]' : 'aspect-[16/10] min-h-[15rem]'
            }`}
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              priority={priority}
              sizes={lead ? '(min-width: 1280px) 850px, (min-width: 1024px) 68vw, 100vw' : '(min-width: 1024px) 60vw, 100vw'}
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
            />
          </Link>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}

function StoryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {children}
    </Link>
  )
}
