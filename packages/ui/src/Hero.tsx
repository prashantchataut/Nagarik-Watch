import Image from 'next/image'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel } from './CategoryLabel'
import { Byline } from './Byline'
import { cn } from './cn'

/**
 * Homepage lead story. A single full-width <a> link wraps the hero image and the display
 * headline so the whole card is one hit target (DESIGN.md §5 hero band). The image is
 * 16:9 and above-the-fold, so it takes next/image `priority`. The deck sits under the
 * headline in the warm ink-soft tone, and the category pill + byline anchor the reader.
 *
 * Banned patterns avoided: no side-stripe, no gradient text, no card-within-card. The
 * headline uses the Mukta display stack at the display size; Devanagari runs keep their
 * tighter line-height via the lang attribute.
 */
type HeroProps = {
  story: StoryCardData
  locale: Locale
  className?: string
}

export function Hero({ story, locale, className }: HeroProps) {
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const deck = locale === 'en' ? story.deckEn : story.deckNe
  const href = `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`
  const titleLang = locale === 'en' && story.titleEn ? 'en' : 'ne'

  return (
    <article className={cn('group', className)}>
      <a href={href} className="block rounded-lg focus:outline-none">
        {story.heroImage && (
          <div className="relative mb-5 overflow-hidden rounded-lg aspect-[16/9]">
            <Image
              src={story.heroImage.url}
              alt={story.heroImage.alt}
              fill
              priority
              sizes="(min-width: 1024px) 100vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
            />
          </div>
        )}
        <CategoryLabel category={story.category} locale={locale} as="span" className="mb-3" />
        <h1
          className="font-display text-display leading-tight text-ink group-hover:text-brand-strong transition-colors duration-fast ease-out-quint"
          lang={titleLang}
        >
          {title}
        </h1>
        {deck && (
          <p
            className="mt-3 max-w-body text-body-lg text-ink-soft leading-relaxed"
            lang={titleLang}
          >
            {deck}
          </p>
        )}
      </a>
      <div className="mt-4">
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
