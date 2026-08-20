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

function authorInitial(name: string): string {
  const clean = name.trim()
  return clean ? Array.from(clean)[0] ?? '' : 'न'
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

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article
        className={`group min-w-0 border-b border-rule py-5 text-center sm:py-6 lg:py-8 ${className}`.trim()}
      >
        <CategoryLabel category={story.category} locale={locale} as="span" />

        {priority ? (
          <h1
            className={`mx-auto mt-2.5 max-w-[28ch] text-balance font-display font-black tracking-[-0.025em] text-ink ${
              lead
                ? 'text-[clamp(1.9rem,4.15vw,3.25rem)] leading-[1.17]'
                : 'text-[clamp(1.8rem,3.65vw,2.9rem)] leading-[1.18]'
            }`}
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
            className={`mx-auto mt-2.5 max-w-[28ch] text-balance font-display font-black tracking-[-0.02em] text-ink ${
              lead
                ? 'text-[clamp(1.9rem,4.15vw,3.25rem)] leading-[1.17]'
                : 'text-[clamp(1.8rem,3.65vw,2.9rem)] leading-[1.18]'
            }`}
            lang={titleLang}
          >
            <Link
              href={href}
              className="transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {title}
            </Link>
          </h2>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-ink-soft">
          <span
            className="flex size-7 items-center justify-center rounded-full bg-brand-tint font-display text-caption font-extrabold text-brand-strong"
            aria-hidden="true"
          >
            {authorInitial(byline)}
          </span>
          {author ? (
            <Link
              href={localizeHref(locale, `/author/${author.slug}`)}
              className="font-semibold text-ink hover:text-brand-strong hover:underline"
              lang={titleLang}
            >
              {author.name}
            </Link>
          ) : (
            <span className="font-semibold text-ink" lang={titleLang}>
              {byline}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <Dateline iso={story.publishedAt} locale={locale} />
        </div>

        {showPhoto ? (
          <Link
            href={href}
            className="relative mt-4 block aspect-[16/10] w-full overflow-hidden bg-surface-raised text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:mt-5 sm:aspect-[16/9]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={image!.url}
              alt={image!.alt}
              fill
              priority={priority}
              sizes="(min-width: 1440px) 1240px, (min-width: 1024px) calc(100vw - 64px), 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
            />
          </Link>
        ) : deck ? (
          <p
            className="mx-auto mt-4 max-w-[48rem] text-pretty text-body leading-relaxed text-ink-soft sm:text-body-lg"
            lang={titleLang}
          >
            {deck}
          </p>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}
