import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

function isRealPhoto(url: string | undefined): boolean {
  return Boolean(url && !url.startsWith('data:'))
}

/** Visual feature for the day. Skips synthetic media so the band never shows a black slab. */
export function PhotoOfTheDay({ locale, story }: { locale: Locale; story: StoryCardData | null }) {
  if (!story?.heroImage?.url || !isRealPhoto(story.heroImage.url)) return null
  const en = locale === 'en'
  const title = en && story.titleEn ? story.titleEn : story.titleNe
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)

  return (
    <section aria-labelledby="photo-of-day-title">
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="photo-of-day-title"
            className="font-display text-h3 font-extrabold text-ink"
            lang={en ? 'en' : 'ne'}
          >
            {en ? 'Photo of the day' : 'आजको फोटो'}
          </h2>
          <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>
      </div>
      <Link href={href} className="group block">
        <div className="relative aspect-[16/10] overflow-hidden bg-brand-tint sm:aspect-[3/2]">
          <Image
            src={story.heroImage.url}
            alt={story.heroImage.alt || title}
            fill
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 480px, 100vw"
          />
        </div>
        <strong
          className="mt-2.5 block font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
          lang={en && story.titleEn ? 'en' : 'ne'}
        >
          <span className="line-clamp-2">{title}</span>
        </strong>
      </Link>
    </section>
  )
}
