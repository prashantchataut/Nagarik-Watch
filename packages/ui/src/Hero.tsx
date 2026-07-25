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

  return (
    <article className={cn('group', className)}>
      <div className="min-w-0">
        <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
        <h1
          className="text-pretty font-display text-[clamp(1.85rem,4.2vw,3.15rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
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
            className="mt-3 max-w-[44rem] text-pretty text-body leading-relaxed text-ink-soft sm:text-body-lg"
            lang={titleLang}
          >
            {deck}
          </p>
        ) : null}
        <div className="mt-3.5">
          <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
        </div>
      </div>

      {hasImage ? (
        <Link
          href={href}
          className="relative mt-5 block aspect-[16/10] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9] sm:mt-6"
        >
          <Image
            src={story.heroImage!.url}
            alt={story.heroImage!.alt}
            fill
            priority
            unoptimized={unoptimized}
            sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
          />
        </Link>
      ) : (
        <div className="mt-5 border-y-2 border-ink" aria-hidden="true" />
      )}
    </article>
  )
}
