import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel } from './CategoryLabel'
import { Byline } from './Byline'
import { cn } from './cn'

type HeroProps = {
  story: StoryCardData
  locale: Locale
  className?: string
}

/**
 * Front-page lead: large headline band, then a dominant photo —
 * dense commercial portal hierarchy for Nepali readers.
 */
export function Hero({ story, locale, className }: HeroProps) {
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const deck = locale === 'en' ? story.deckEn : story.deckNe
  const href = `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}/`
  const titleLang = locale === 'en' && story.titleEn ? 'en' : 'ne'
  const unoptimized = story.heroImage ? story.heroImage.url.startsWith('data:') : false
  const hasImage = Boolean(story.heroImage?.url)
  const placeholderMedia = unoptimized
  const showLeadPhoto = hasImage && !placeholderMedia

  return (
    <article className={cn('group', className)}>
      <div
        className={cn(
          showLeadPhoto ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:items-start xl:gap-5' : '',
        )}
      >
        <div className="min-w-0">
          <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
          <h1
            className="text-pretty font-display text-[clamp(1.75rem,3.8vw,2.85rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong xl:text-[clamp(1.85rem,3.2vw,2.65rem)]"
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
              className="mt-2 max-w-[44rem] text-pretty text-body leading-relaxed text-ink-soft sm:text-body-lg xl:mt-2.5"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}
          <div className="mt-3">
            <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
          </div>
        </div>

        {showLeadPhoto ? (
          <Link
            href={href}
            className="relative mt-3 block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand xl:mt-0 xl:aspect-[4/3]"
          >
            <Image
              src={story.heroImage!.url}
              alt={story.heroImage!.alt}
              fill
              priority
              unoptimized={unoptimized}
              sizes="(min-width: 1280px) 420px, (min-width: 1024px) 45vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
            />
          </Link>
        ) : (
          <div className="mt-3 border-y border-rule xl:mt-0" aria-hidden="true" />
        )}
      </div>
    </article>
  )
}
