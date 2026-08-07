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
  className?: string
}

/**
 * A1 portal-feed lead block: centered category pill → display headline → byline → image.
 * Matches OnlineKhabar / Ratopati / NepalKhabar grammar without copying their brand colors.
 */
export function MegaStoryBlock({
  story,
  locale,
  priority = false,
  className = '',
}: MegaStoryBlockProps) {
  const english = locale === 'en'
  const title = english && story.titleEn ? story.titleEn : story.titleNe
  const titleLang = english && story.titleEn ? 'en' : 'ne'
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
  const image = story.heroImage
  const unoptimized = Boolean(image?.url?.startsWith('data:'))
  const showPhoto = Boolean(image?.url) && !unoptimized

  return (
    <article className={`mega-story group text-center ${className}`.trim()}>
      <div className="mx-auto flex max-w-[46rem] flex-col items-center">
        <CategoryLabel
          category={story.category}
          locale={locale}
          as="span"
          className="mb-2.5 !mx-auto"
        />
        <h2
          className="text-pretty font-display text-[clamp(1.65rem,4.2vw,3.25rem)] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
          lang={titleLang}
        >
          <Link
            href={href}
            className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {title}
          </Link>
        </h2>
        <div className="mt-3 flex justify-center">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </div>

      {showPhoto ? (
        <Link
          href={href}
          className="relative mt-4 block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aspect-[16/10] sm:mt-5 sm:aspect-[16/9]"
        >
          <Image
            src={image!.url}
            alt={image!.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 1120px, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
          />
        </Link>
      ) : (
        <div className="mx-auto mt-4 h-px w-16 bg-rule sm:mt-5" aria-hidden="true" />
      )}
    </article>
  )
}
