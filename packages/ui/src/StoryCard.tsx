import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel } from './CategoryLabel'
import { Byline } from './Byline'
import { cn } from './cn'

/**
 * Story card, the workhorse surface of the reader site. Four variants deliberately differ
 * in more than size (impeccable ban on identical-card grids): featured is a big 16:9 lead,
 * default is the standard 4:3 news card, horizontal is a side-by-side list row, compact is
 * text-only for dense rails. Each variant carries its own heading level so the document
 * outline stays correct regardless of placement.
 */
export type StoryCardVariant = 'featured' | 'default' | 'horizontal' | 'compact'

type StoryCardProps = {
  story: StoryCardData
  locale: Locale
  variant?: StoryCardVariant
  /** Optional priority flag, forwarded to next/image for above-the-fold heroes. */
  priority?: boolean
  className?: string
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function hrefFor(story: StoryCardData, locale: Locale): string {
  return `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`
}

export function StoryCard({
  story,
  locale,
  variant = 'default',
  priority = false,
  className,
}: StoryCardProps) {
  const title = titleFor(story, locale)
  const deck = deckFor(story, locale)
  const href = hrefFor(story, locale)
  const titleLang = locale === 'en' && story.titleEn ? 'en' : 'ne'

  if (variant === 'compact') {
    return (
      <article className={cn('group', className)}>
        <Link href={href} className="block">
          <CategoryLabel category={story.category} locale={locale} as="span" className="mb-1" />
          <h3
            className="text-h3 font-display text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
            lang={titleLang}
          >
            {title}
          </h3>
        </Link>
        <div className="mt-1">
          <Byline
            authors={story.authors}
            locale={locale}
            publishedAt={story.publishedAt}
            source={undefined}
          />
        </div>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className={cn('group flex gap-4', className)}>
        {story.heroImage && (
          <Link
            href={href}
            className="relative block w-28 shrink-0 overflow-hidden rounded-md aspect-[4/3]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <Image
              src={story.heroImage.url}
              alt={story.heroImage.alt}
              fill
              sizes="112px"
              className="object-cover"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <CategoryLabel category={story.category} locale={locale} as="span" className="mb-1" />
          <Link href={href}>
            <h3
              className="text-body-lg font-display text-ink leading-snug group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
              lang={titleLang}
            >
              {title}
            </h3>
          </Link>
          <div className="mt-1">
            <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
          </div>
        </div>
      </article>
    )
  }

  const isFeatured = variant === 'featured'
  const HeadingTag = isFeatured ? 'h2' : 'h3'
  const imgSizes = isFeatured ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 768px) 33vw, 100vw'

  return (
    <article className={cn('group flex flex-col', className)}>
      {story.heroImage && (
        <Link
          href={href}
          className={cn(
            'relative block overflow-hidden rounded-lg mb-3',
            isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]',
          )}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={story.heroImage.url}
            alt={story.heroImage.alt}
            fill
            priority={priority}
            sizes={imgSizes}
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
          />
        </Link>
      )}
      <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
      <Link href={href}>
        <HeadingTag
          className={cn(
            'font-display text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint',
            isFeatured ? 'text-h1 leading-tight' : 'text-h2 leading-snug',
          )}
          lang={titleLang}
        >
          {title}
        </HeadingTag>
      </Link>
      {deck && (
        <p className="mt-2 text-body-lg text-ink-soft leading-relaxed" lang={titleLang}>
          {deck}
        </p>
      )}
      <div className="mt-3">
        <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
      </div>
    </article>
  )
}
