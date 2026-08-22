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
 * A deliberate editorial close: one compact conversion band followed only by
 * archive/photo modules that have real inventory. No empty columns or filler.
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
      className="mt-10 sm:mt-12"
      aria-label={english ? 'More from the newsroom' : 'समाचार कक्षबाट थप'}
    >
      <div className="bg-brand-tint/30 px-4 py-4 sm:px-5 sm:py-5 lg:grid lg:grid-cols-[minmax(13rem,0.38fr)_minmax(0,0.62fr)] lg:items-center lg:gap-7">
        <div className="mb-3 lg:mb-0" lang={english ? 'en' : 'ne'}>
          <p className="font-display text-h3 font-extrabold text-ink">
            {english ? 'Daily briefing, in one email.' : 'दैनिक ब्रिफिङ, एक इमेलमा।'}
          </p>
          <p className="mt-1 text-meta leading-relaxed text-ink-soft">
            {english
              ? 'A concise digest of important reporting and public-service updates.'
              : 'महत्त्वपूर्ण रिपोर्टिङ र सार्वजनिक सेवा अपडेटको छोटो डाइजेस्ट।'}
          </p>
        </div>
        <NewsletterInline locale={locale} />
      </div>

      {hasHistory || hasPhoto ? (
        <div
          className={`mt-8 grid gap-8 ${
            hasHistory && hasPhoto
              ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-8'
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
