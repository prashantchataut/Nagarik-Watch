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

export function Hero({ story, locale, className }: HeroProps) {
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const deck = locale === 'en' ? story.deckEn : story.deckNe
  const href = `${locale === 'en' ? '/en' : ''}/${story.category.slug}/${story.slug}`
  const titleLang = locale === 'en' && story.titleEn ? 'en' : 'ne'
  const unoptimized = story.heroImage ? story.heroImage.url.startsWith('data:') : false

  return (
    <article className={cn('group', className)}>
      {story.heroImage ? (
        <Link
          href={href}
          className="relative mb-5 block aspect-[16/10] overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9] sm:mb-6"
        >
          <Image
            src={story.heroImage.url}
            alt={story.heroImage.alt}
            fill
            priority
            unoptimized={unoptimized}
            sizes="(min-width: 1280px) 700px, (min-width: 1024px) 56vw, 100vw"
            className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.02]"
          />
        </Link>
      ) : (
        <Link
          href={href}
          className="relative mb-5 block aspect-[16/10] overflow-hidden border border-rule bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:aspect-[16/9] sm:mb-6"
          aria-hidden="true"
          tabIndex={-1}
        >
          <span className="absolute inset-0 bg-[linear-gradient(135deg,var(--brand-tint),transparent_55%)]" />
          <span className="absolute bottom-4 left-4 font-display text-meta font-bold uppercase tracking-[0.14em] text-brand-strong">
            {locale === 'en' && story.category.nameEn ? story.category.nameEn : story.category.nameNe}
          </span>
        </Link>
      )}
      <CategoryLabel category={story.category} locale={locale} as="span" className="mb-3" />
      <h1
        className="max-w-[22ch] text-pretty font-display text-[clamp(1.85rem,4.2vw,3.35rem)] font-black leading-[1.08] tracking-[-0.025em] text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
        lang={titleLang}
      >
        <Link href={href} className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          {title}
        </Link>
      </h1>
      {deck ? (
        <p
          className="mt-4 max-w-[42rem] text-pretty text-body-lg leading-relaxed text-ink-soft"
          lang={titleLang}
        >
          {deck}
        </p>
      ) : null}
      <div className="mt-5 border-t border-rule pt-3">
        <Byline authors={story.authors} locale={locale} publishedAt={story.publishedAt} />
      </div>
    </article>
  )
}
