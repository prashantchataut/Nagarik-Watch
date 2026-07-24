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

function resolveVariant(variant: StoryCardVariant): Exclude<
  StoryCardVariant,
  'lead' | 'standard' | 'text-only'
> {
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
  return `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`
}
function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

function isPublicMembershipEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC === 'true'
}

function PremiumBadge({ locale }: { locale: Locale }) {
  return (
    <span className="inline-flex rounded-sm bg-ink px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-surface">
      {locale === 'en' ? 'Premium' : 'सदस्य'}
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
        <div className="mb-1 flex flex-wrap items-center gap-2"><CategoryLabel category={story.category} locale={locale} as="span" /><MembershipMarker story={story} locale={locale} /></div>
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
      <article className={cn('group relative flex flex-col', className)}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2"><CategoryLabel category={story.category} locale={locale} as="span" /><MembershipMarker story={story} locale={locale} /></div>
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

  // image-led: keep photography and copy in separate, legible planes. This avoids
  // the generic gradient-overlay treatment and preserves headline contrast at every crop.
  if (layout === 'overlay' && story.heroImage) {
    return (
      <article className={cn('group relative border-t-4 border-ink pt-3', className)}>
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
        <div className="border-b border-rule bg-ink px-4 py-4 text-surface sm:px-5 sm:py-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryLabel category={story.category} locale={locale} as="span" className="bg-surface px-2 py-0.5 text-ink" />
            <MembershipMarker story={story} locale={locale} />
          </div>
          <h3 className="font-display text-h2 leading-tight text-surface" lang={titleLang}>
            <Link href={href} className="transition-opacity duration-fast ease-out-quint hover:opacity-80">
              {title}
            </Link>
          </h3>
          {deck && <p className="mt-2 line-clamp-2 text-meta leading-relaxed text-surface/80" lang={titleLang}>{deck}</p>}
        </div>
      </article>
    )
  }

  if (layout === 'horizontal') {
    return (
      <article className={cn('group relative flex gap-3', className)}>
        {story.heroImage ? (
          <div className="relative block w-24 shrink-0 overflow-hidden aspect-[4/3] sm:w-28">
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
        ) : null}
        <div className="min-w-0 flex-1">
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

  return (
    <article className={cn('group relative flex flex-col', className)}>
      {story.heroImage && (
        <div
          className={cn(
            'relative block overflow-hidden rounded-sm mb-3',
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
      <div className="mb-2 flex flex-wrap items-center gap-2"><CategoryLabel category={story.category} locale={locale} as="span" /><MembershipMarker story={story} locale={locale} /></div>
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
