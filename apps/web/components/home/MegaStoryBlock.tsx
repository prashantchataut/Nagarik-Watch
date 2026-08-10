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
  /** Lead is larger display type; standard is the follow-on mega. */
  size?: 'lead' | 'standard'
  className?: string
}

/**
 * A1 portal-feed lead: centered category pill → display headline → deck → byline → image.
 * Civic Crimson portal grammar; dense Devanagari reading matching OnlineKhabar and Ratopati.
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
    ? 'text-[clamp(2.1rem,4.8vw,3.75rem)] font-black leading-[1.12] tracking-[-0.025em]'
    : 'text-[clamp(1.6rem,3.6vw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em]'

  return (
    <article className={`mega-story group text-center ${className}`.trim()}>
      <div className="mx-auto flex max-w-[50rem] flex-col items-center px-2">
        <div className="mb-2.5 inline-flex items-center justify-center">
          <CategoryLabel
            category={story.category}
            locale={locale}
            as="span"
            className="!mx-auto px-2.5 py-0.5 rounded-full bg-brand-tint text-brand-strong font-bold text-caption tracking-wider"
          />
        </div>

        <h1
          className={`text-pretty font-display text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong ${titleClass}`}
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
            className="mt-3 max-w-[44rem] text-pretty text-body leading-relaxed text-ink-soft line-clamp-2 sm:text-body-lg sm:leading-relaxed"
            lang={titleLang}
          >
            {deck}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-center gap-2">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </div>

      {showPhoto ? (
        <Link
          href={href}
          className={`relative mt-4 block overflow-hidden rounded-md bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:mt-5 ${
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
            sizes="(min-width: 1280px) 1140px, (min-width: 1024px) 90vw, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
          />
        </Link>
      ) : (
        <div className="mx-auto mt-4 h-px w-16 bg-rule sm:mt-5" aria-hidden="true" />
      )}
    </article>
  )
}
