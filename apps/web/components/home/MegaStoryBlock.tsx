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
 * Civic Crimson portal grammar; dense Devanagari reading, not SaaS hero chrome.
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
  const titleClass =
    size === 'lead'
      ? 'text-[clamp(1.7rem,4.4vw,3.35rem)] leading-[1.12]'
      : 'text-[clamp(1.4rem,3.4vw,2.45rem)] leading-[1.15]'

  return (
    <article className={`mega-story group text-center ${className}`.trim()}>
      <div className="mx-auto flex max-w-[42rem] flex-col items-center">
        <CategoryLabel
          category={story.category}
          locale={locale}
          as="span"
          className="mb-2 !mx-auto"
        />
        <h2
          className={`text-pretty font-display font-extrabold tracking-[-0.02em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong ${titleClass}`}
          lang={titleLang}
        >
          <Link
            href={href}
            className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {title}
          </Link>
        </h2>
        {deck ? (
          <p
            className="mt-2.5 max-w-[36rem] text-pretty text-body leading-relaxed text-ink-soft line-clamp-2 sm:text-body-lg"
            lang={titleLang}
          >
            {deck}
          </p>
        ) : null}
        <div className="mt-2.5 flex justify-center">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </div>

      {showPhoto ? (
        <Link
          href={href}
          className={`relative mt-3.5 block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:mt-4 ${
            size === 'lead' ? 'aspect-[16/10] sm:aspect-[16/9]' : 'aspect-[16/10] sm:aspect-[2/1]'
          }`}
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
        <div className="mx-auto mt-3.5 h-px w-14 bg-rule sm:mt-4" aria-hidden="true" />
      )}
    </article>
  )
}
