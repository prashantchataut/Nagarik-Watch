import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Byline, CategoryLabel } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

type MegaStoryBlockProps = {
  story: StoryCardData
  locale: Locale
  /** First story gets priority image fetch. */
  priority?: boolean
  /** Lead is larger display type; standard is the follow-on. */
  size?: 'lead' | 'standard'
  className?: string
}

/**
 * Single-story lead row for non-homepage surfaces.
 * Left-aligned, packed. Never centered mega voids.
 */
export function MegaStoryBlock({
  story,
  locale,
  priority = false,
  size = 'lead',
  className = '',
}: MegaStoryBlockProps) {
  const english = locale === 'en'
  const title = english && story.titleEn ? story.titleEn : story.titleNe
  const titleLang = english && story.titleEn ? 'en' : 'ne'
  const deck = english ? story.deckEn : story.deckNe
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
  const image = story.heroImage
  const unoptimized = Boolean(image?.url?.startsWith('data:'))
  const showPhoto = Boolean(image?.url) && !unoptimized
  const isLead = size === 'lead'

  const titleClass = isLead
    ? 'text-[clamp(1.7rem,3.4vw,2.75rem)] font-black leading-[1.16]'
    : 'text-[clamp(1.35rem,2.6vw,1.85rem)] font-extrabold leading-[1.18]'

  return (
    <article className={`mega-story group min-w-0 text-start ${className}`.trim()}>
      {showPhoto ? (
        <Link
          href={href}
          className={`relative mb-3 block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:mb-3.5 ${
            isLead ? 'aspect-[16/10] sm:aspect-[16/9]' : 'aspect-[16/10] sm:aspect-[2/1]'
          }`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={image!.url}
            alt={image!.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 820px, (min-width: 1024px) 64vw, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
          />
        </Link>
      ) : null}

      <div className={!showPhoto ? 'border-t-2 border-brand pt-3' : ''}>
        <CategoryLabel category={story.category} locale={locale} as="span" />

        <h1
          className={`mt-1.5 text-pretty font-display text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong ${titleClass}`}
          lang={titleLang}
        >
          <Link
            href={href}
            className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {title}
          </Link>
        </h1>

        {deck ? (
          <p
            className="mt-2 max-w-[42rem] text-pretty text-body leading-relaxed text-ink-soft line-clamp-3 sm:text-body-lg sm:leading-relaxed"
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
  )
}
