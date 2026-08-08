import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { NewsletterInline } from '@/components/NewsletterInline'
import { TodayInHistory } from '@/components/home/TodayInHistory'
import { PhotoOfTheDay } from '@/components/home/PhotoOfTheDay'

type HomeClosingDeskProps = {
  locale: Locale
  historyStories: StoryCardData[]
  historyMode: 'anniversary' | 'archive'
  photoOfDay: StoryCardData | null
}

/**
 * Homepage close: compact newsletter strip + archive/history + photo desk.
 * One band, shared rhythm — not three orphan SaaS modules with dead space.
 */
export function HomeClosingDesk({
  locale,
  historyStories,
  historyMode,
  photoOfDay,
}: HomeClosingDeskProps) {
  const english = locale === 'en'
  const hasHistory = historyStories.length > 0
  const hasPhoto = Boolean(photoOfDay)

  return (
    <section
      className="mt-5 border-t border-rule pt-5"
      aria-label={english ? 'More from the newsroom' : 'समाचार कक्षबाट थप'}
    >
      <div className="border border-rule bg-surface-raised px-3 py-3 sm:px-4 sm:py-3.5">
        <NewsletterInline locale={locale} />
      </div>

      {hasHistory || hasPhoto ? (
        <div
          className={`mt-5 grid gap-5 ${
            hasHistory && hasPhoto
              ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-6 lg:items-start'
              : ''
          }`}
        >
          {hasHistory ? (
            <TodayInHistory locale={locale} stories={historyStories} mode={historyMode} />
          ) : null}
          {hasPhoto ? <PhotoOfTheDay locale={locale} story={photoOfDay} /> : null}
        </div>
      ) : null}
    </section>
  )
}
