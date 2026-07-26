import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

/** Compact numbered most-read list for the homepage rail. */
export function MostReadRail({
  locale,
  stories,
  className,
}: {
  locale: Locale
  stories: StoryCardData[]
  className?: string
}) {
  if (stories.length === 0) return null
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <section className={className} aria-labelledby="most-read-title" lang={lang}>
      <div className="mb-2.5">
        <h2 id="most-read-title" className="font-display text-h3 font-extrabold text-ink">
          {en ? 'Most read' : 'धेरै पढिएको'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      </div>
      <ol className="divide-y divide-rule border-y border-rule">
        {stories.slice(0, 6).map((story, index) => {
          const title = en && story.titleEn ? story.titleEn : story.titleNe
          return (
            <li key={story.id}>
              <Link
                href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                className="group flex min-h-11 items-start gap-3 py-2.5"
              >
                <span
                  className="mt-0.5 w-5 shrink-0 text-right font-display text-meta font-bold tabular-nums text-brand"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
                  <span className="line-clamp-2">{title}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
      <p className="pt-3">
        <Link
          href={localizeHref(locale, '/most-read')}
          className="inline-flex min-h-9 items-center text-meta font-bold text-brand-strong underline-offset-4 hover:underline"
        >
          {en ? 'Full list' : 'पूर्ण सूची'}
        </Link>
      </p>
    </section>
  )
}
