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
/** Runtime layout keys. DESIGN.md uses lead|standard|compact|text-only aliases. */
export type StoryCardVariant =
  | 'featured'
  | 'default'
  | 'horizontal'
  | 'compact'
  | 'text-led'
  | 'overlay'
  | 'lead'
  | 'standard'
  | 'text-only'

type StoryCardProps = {
  story: StoryCardData
  locale: Locale
  variant?: StoryCardVariant
  priority?: boolean
  className?: string
}

function resolveVariant(
  variant: StoryCardVariant,
): Exclude<StoryCardVariant, 'lead' | 'standard' | 'text-only'> {
  if (variant === 'lead') return 'featured'
  if (variant === 'standard') return 'default'
  if (variant === 'text-only') return 'compact'
  return variant
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}
function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}
function hrefFor(story: StoryCardData, locale: Locale): string {
  return `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}/`
}
function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

function isPublicMembershipEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC === 'true'
}

function PremiumBadge({ locale }: { locale: Locale }) {
  const english = locale === 'en'
  return (
    <span
      className={cn(
        'inline-flex rounded-sm bg-ink px-2 py-0.5 text-[0.65rem] font-bold text-surface',
        english ? 'uppercase tracking-[0.06em]' : 'tracking-normal',
      )}
      lang={english ? 'en' : 'ne'}
    >
      {english ? 'Premium' : 'सदस्य'}
    </span>
  )
}

function MembershipMarker({ story, locale }: { story: StoryCardData; locale: Locale }) {
  if (!isPublicMembershipEnabled() || !story.premium) return null
  return <PremiumBadge locale={locale} />
}

export function StoryCard({
  story,
  locale,
  variant = 'default',
  priority = false,
  className,
}: StoryCardProps) {
  const layout = resolveVariant(variant)
  const title = titleFor(story, locale)
  const deck = deckFor(story, locale)
  const href = hrefFor(story, locale)
  const titleLang = locale === 'en' && story.titleEn ? 'en' : 'ne'
  const unoptimized = story.heroImage ? isDataUrl(story.heroImage.url) : false

  if (layout === 'compact') {
    return (
      <article className={cn('group relative', className)}>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <MembershipMarker story={story} locale={locale} />
        </div>
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
  if (layout === 'text-led') {
    return (
      <article className={cn('group relative', className)}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <MembershipMarker story={story} locale={locale} />
        </div>
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
        <div className="mt-2.5">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </article>
    )
  }

  // image-led: keep photography and copy in separate, legible planes. This avoids
  // the generic gradient-overlay treatment and preserves headline contrast at every crop.
  // Prefer photographic mosaics only. SVG stand-ins look unfinished at large aspect,
  // so fall through to the default image+copy card instead of a giant empty plane.
  if (layout === 'overlay' && story.heroImage && !isDataUrl(story.heroImage.url)) {
    return (
      <article className={cn('group relative border-t-2 border-brand pt-3', className)}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm sm:aspect-[3/4]">
          <Image
            src={story.heroImage.url}
            alt=""
            fill
            priority={priority}
            unoptimized={unoptimized}
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.025]"
            aria-hidden="true"
          />
        </div>
        <div className="border-b border-rule bg-surface-raised px-4 py-4 text-ink sm:px-5 sm:py-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryLabel category={story.category} locale={locale} as="span" />
            <MembershipMarker story={story} locale={locale} />
          </div>
          <h3 className="font-display text-h2 leading-tight text-ink" lang={titleLang}>
            <Link
              href={href}
              className="transition-colors duration-fast ease-out-quint hover:text-brand-strong"
            >
              {title}
            </Link>
          </h3>
          {deck && (
            <p
              className="mt-2 line-clamp-2 text-meta leading-relaxed text-ink-soft"
              lang={titleLang}
            >
              {deck}
            </p>
          )}
        </div>
      </article>
    )
  }

  if (layout === 'horizontal') {
    const showThumb = story.heroImage && !unoptimized
    return (
      <article className={cn('group relative flex flex-nowrap items-start gap-3', className)}>
        {showThumb ? (
          <div className="relative block w-[4.75rem] shrink-0 overflow-hidden aspect-[4/3] bg-brand-tint sm:w-24">
            <Image
              src={story.heroImage!.url}
              alt=""
              fill
              unoptimized={unoptimized}
              sizes="96px"
              className="object-cover"
              aria-hidden="true"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <CategoryLabel category={story.category} locale={locale} as="span" />
            <MembershipMarker story={story} locale={locale} />
          </div>
          <h3
            className="text-body font-display font-bold text-ink leading-snug group-hover:text-brand-strong transition-colors duration-fast ease-out-quint sm:text-body-lg"
            lang={titleLang}
          >
            <Link href={href}>{title}</Link>
          </h3>
          {deck ? (
            <p
              className="mt-1 line-clamp-1 text-caption leading-relaxed text-ink-soft"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}
          <div className="mt-1">
            <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
          </div>
        </div>
      </article>
    )
  }

  const isFeatured = layout === 'featured'
  const HeadingTag = isFeatured ? 'h2' : 'h3'
  const imgSizes = isFeatured ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 768px) 33vw, 100vw'
  const placeholderMedia = story.heroImage ? isDataUrl(story.heroImage.url) : false
  const showFeaturedPhoto = story.heroImage && !placeholderMedia

  if (isFeatured && placeholderMedia) {
    return (
      <article
        className={cn('group relative flex flex-col border-t-2 border-brand pt-3', className)}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CategoryLabel category={story.category} locale={locale} as="span" />
          <MembershipMarker story={story} locale={locale} />
        </div>
        <HeadingTag
          className="font-display text-h1 leading-tight text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
          lang={titleLang}
        >
          <Link href={href}>{title}</Link>
        </HeadingTag>
        {deck ? (
          <p
            className="mt-2 line-clamp-3 text-body-lg leading-relaxed text-ink-soft"
            lang={titleLang}
          >
            {deck}
          </p>
        ) : null}
        <div className="mt-3">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </article>
    )
  }

  return (
    <article className={cn('group relative flex flex-col', className)}>
      {showFeaturedPhoto || (!isFeatured && story.heroImage && !placeholderMedia) ? (
        <div
          className={cn(
            'relative mb-3 block overflow-hidden rounded-sm bg-brand-tint',
            isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]',
          )}
        >
          <Image
            src={story.heroImage!.url}
            alt=""
            fill
            priority={priority}
            unoptimized={unoptimized}
            sizes={imgSizes}
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
            aria-hidden="true"
          />
        </div>
      ) : isFeatured ? (
        <div className="mb-3 border-t-2 border-brand pt-3" aria-hidden="true" />
      ) : null}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <CategoryLabel category={story.category} locale={locale} as="span" />
        <MembershipMarker story={story} locale={locale} />
      </div>
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
        <p
          className="mt-2 text-body-lg text-ink-soft leading-relaxed line-clamp-3"
          lang={titleLang}
        >
          {deck}
        </p>
      )}
      <div className="mt-3">
        <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
      </div>
    </article>
  )
}
