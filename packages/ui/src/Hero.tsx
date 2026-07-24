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
 * Front-page lead: newspaper density — photo + headline in one band when media
 * exists; typography-led lead when it does not (never an empty aspect-ratio void).
 */
export function Hero({ story, locale, className }: HeroProps) {
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const deck = locale === 'en' ? story.deckEn : story.deckNe
  const href = `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`
  const titleLang = locale === 'en' && story.titleEn ? 'en' : 'ne'
  const unoptimized = story.heroImage ? story.heroImage.url.startsWith('data:') : false
  const hasImage = Boolean(story.heroImage?.url)

  return (
    <article className={cn('group', className)}>
      {hasImage ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end lg:gap-7">
          <Link
            href={href}
            className="relative block aspect-[16/10] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9]"
          >
            <Image
              src={story.heroImage!.url}
              alt={story.heroImage!.alt}
              fill
              priority
              unoptimized={unoptimized}
              sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
            />
          </Link>
          <div className="min-w-0">
            <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
            <h1
              className="text-pretty font-display text-[clamp(1.65rem,3.4vw,2.65rem)] font-extrabold leading-[1.12] tracking-[-0.02em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
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
                className="mt-3 max-w-[40rem] text-pretty text-body leading-relaxed text-ink-soft"
                lang={titleLang}
              >
                {deck}
              </p>
            ) : null}
            <div className="mt-4 border-t border-rule pt-3">
              <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
            </div>
          </div>
        </div>
      ) : (
        <div className="border-y border-ink py-5 sm:py-6">
          <CategoryLabel category={story.category} locale={locale} as="span" className="mb-2" />
          <h1
            className="max-w-[28ch] text-pretty font-display text-[clamp(1.85rem,4vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
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
              className="mt-3 max-w-[42rem] text-pretty text-body-lg leading-relaxed text-ink-soft"
              lang={titleLang}
            >
              {deck}
            </p>
          ) : null}
          <div className="mt-4 border-t border-rule pt-3">
            <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
          </div>
        </div>
      )}
    </article>
  )
}
