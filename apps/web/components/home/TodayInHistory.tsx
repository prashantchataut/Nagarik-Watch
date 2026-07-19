import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

/** Shows anniversary-style stories only when the corpus has dated matches. */
export function TodayInHistory({
  locale,
  stories,
}: {
  locale: Locale
  stories: StoryCardData[]
}) {
  if (stories.length === 0) return null
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  return (
    <section
      className="border-t border-rule pt-8"
      aria-labelledby="today-in-history-title"
      lang={lang}
    >
      <h2 id="today-in-history-title" className="font-display text-h2 text-ink">
        {en ? 'Today in history' : 'आजको इतिहास'}
      </h2>
      <ul className="mt-4 divide-y divide-rule border-y border-rule">
        {stories.slice(0, 4).map((story) => (
          <li key={story.id}>
            <Link
              href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
              className="flex min-h-12 items-center py-3 font-display text-body font-bold text-ink hover:text-brand-strong"
            >
              {en && story.titleEn ? story.titleEn : story.titleNe}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
