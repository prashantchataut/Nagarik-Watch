import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

/** Renders only when a photo-story with a real (non-data) hero image exists. */
export function PhotoOfTheDay({
  locale,
  story,
}: {
  locale: Locale
  story: StoryCardData | null
}) {
  if (!story?.heroImage?.url || story.heroImage.url.startsWith('data:')) return null
  const en = locale === 'en'
  const title = en && story.titleEn ? story.titleEn : story.titleNe
  return (
    <section className="border-t border-rule pt-8" aria-labelledby="photo-of-day-title">
      <h2 id="photo-of-day-title" className="font-display text-h2 text-ink" lang={en ? 'en' : 'ne'}>
        {en ? 'Photo of the day' : 'आजको फोटो'}
      </h2>
      <Link
        href={localizeHref(locale, `/photos/${story.slug}`)}
        className="mt-4 block group"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
          <Image
            src={story.heroImage.url}
            alt={story.heroImage.alt || title}
            fill
            className="object-cover transition-transform duration-slow group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 720px, 100vw"
          />
        </div>
        <strong className="mt-3 block font-display text-h3 text-ink group-hover:text-brand-strong">
          {title}
        </strong>
      </Link>
    </section>
  )
}
