import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel } from './CategoryLabel'
import { Byline } from './Byline'
import { cn } from './cn'

/**
 * Story card. v3 fixes:
 *   - Accessibility: the image is decorative (alt="" + aria-hidden). The
 *     headline link is the lone semantic action. No aria-hidden on focusable
 *     elements (fixes the prior WCAG violation).
 *   - Images: data: URLs (SVG placeholders) load with `unoptimized` so
 *     next/image passes them through. Remote URLs go through the optimizer.
 */
export type StoryCardVariant =
  | 'featured'
  | 'default'
  | 'horizontal'
  | 'compact'
  | 'text-led'
  | 'overlay'

type StoryCardProps = {
  story: StoryCardData
  locale: Locale
  variant?: StoryCardVariant
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
function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
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
  const unoptimized = story.heroImage ? isDataUrl(story.heroImage.url) : false

  if (variant === 'compact') {
    return (
      <article className={cn('group relative', className)}>
        <CategoryLabel category={story.category} locale={locale} as="span" className="mb-1" />
        <h3
          className="text-h3 font-display text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
          lang={titleLang}
        >
          <Link href={href}>{title}</Link>
        </h3>
        <div className="mt-1">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </article>
    )
  }

  // text-led: headline-forward, no image. For opinion, analysis, and dense
  // news rails where the image would distract from the headline hierarchy.
  // A brand-tinted category bar sits above the headline for visual anchoring.
  if (variant === 'text-led') {
    return (
      <article className={cn('group relative flex flex-col', className)}>
        <span className="mb-2 h-0.5 w-8 bg-brand" aria-hidden="true" />
        <CategoryLabel category={story.category} locale={locale} as="span" className="mb-1.5" />
        <h3
          className="font-display text-h2 leading-snug text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
          lang={titleLang}
        >
          <Link href={href}>{title}</Link>
        </h3>
        {deck && (
          <p className="mt-2 text-body text-ink-soft leading-relaxed line-clamp-2" lang={titleLang}>
            {deck}
          </p>
        )}
        <div className="mt-auto pt-3">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </article>
    )
  }

  // overlay: headline sits ON the image (image-led, magazine-style). For
  // featured rails and photo-driven stories. The image carries a gradient
  // scrim so the white text always meets AA contrast.
  if (variant === 'overlay' && story.heroImage) {
    return (
      <article className={cn('group relative overflow-hidden rounded-lg', className)}>
        <div className="relative aspect-[4/3] sm:aspect-[3/4]">
          <Image
            src={story.heroImage.url}
            alt=""
            fill
            priority={priority}
            unoptimized={unoptimized}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.04]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent"
            aria-hidden="true"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <CategoryLabel
            category={story.category}
            locale={locale}
            as="span"
            className="mb-2 bg-surface/90 px-2 py-0.5"
          />
          <h3
            className="font-display text-h2 leading-tight text-surface group-hover:opacity-90 transition-opacity duration-fast ease-out-quint"
            lang={titleLang}
          >
            <Link href={href} className="after:absolute after:inset-0 after:content-['']">
              {title}
            </Link>
          </h3>
          {deck && (
            <p className="mt-1.5 text-meta text-surface/80 line-clamp-2" lang={titleLang}>
              {deck}
            </p>
          )}
        </div>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className={cn('group relative flex gap-4', className)}>
        {story.heroImage && (
          <div className="relative block w-28 shrink-0 overflow-hidden rounded-md aspect-[4/3]">
            <Image
              src={story.heroImage.url}
              alt=""
              fill
              unoptimized={unoptimized}
              sizes="112px"
              className="object-cover"
              aria-hidden="true"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <CategoryLabel category={story.category} locale={locale} as="span" className="mb-1" />
          <h3
            className="text-body-lg font-display text-ink leading-snug group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
            lang={titleLang}
          >
            <Link href={href}>{title}</Link>
          </h3>
          {deck && (
            <p className="mt-1 line-clamp-2 text-meta text-ink-soft" lang={titleLang}>
              {deck}
            </p>
          )}
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
    <article className={cn('group relative flex flex-col', className)}>
      {story.heroImage && (
        <div
          className={cn(
            'relative block overflow-hidden rounded-lg mb-3',
            isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]',
          )}
        >
          <Image
            src={story.heroImage.url}
            alt=""
            fill
            priority={priority}
            unoptimized={unoptimized}
            sizes={imgSizes}
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
            aria-hidden="true"
          />
        </div>
      )}
      <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
      <HeadingTag
        className={cn(
          'font-display text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint',
          isFeatured ? 'text-h1 leading-tight' : 'text-h2 leading-snug',
        )}
        lang={titleLang}
      >
        <Link href={href}>{title}</Link>
      </HeadingTag>
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
