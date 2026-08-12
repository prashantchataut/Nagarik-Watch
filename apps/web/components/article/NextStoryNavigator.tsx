import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

type NextStoryNavigatorProps = {
  nextStory?: StoryCardData | null
  prevStory?: StoryCardData | null
  locale: Locale
}

export function NextStoryNavigator({ nextStory, prevStory, locale }: NextStoryNavigatorProps) {
  if (!nextStory && !prevStory) return null

  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const labelClass = en
    ? 'text-[0.72rem] font-bold uppercase tracking-[0.05em]'
    : 'font-display text-caption font-extrabold'

  return (
    <nav
      aria-label={en ? 'Article navigation' : 'समाचार नेभिगेसन'}
      className="my-8 grid gap-3 border-y border-rule py-4 sm:grid-cols-2 print:hidden"
      lang={lang}
    >
      {prevStory ? (
        <Link
          href={localizeHref(locale, `/${prevStory.category.slug}/${prevStory.slug}`)}
          className="group flex min-h-24 flex-col justify-center gap-1 border border-rule bg-surface-raised/40 p-3 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className={`${labelClass} text-mute`}>
            {en ? '← Previous story' : '← अघिल्लो समाचार'}
          </span>
          <span className="line-clamp-2 font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
            {en && prevStory.titleEn ? prevStory.titleEn : prevStory.titleNe}
          </span>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {nextStory ? (
        <Link
          href={localizeHref(locale, `/${nextStory.category.slug}/${nextStory.slug}`)}
          className="group flex min-h-24 flex-col items-end justify-center gap-1 border border-rule bg-surface-raised/40 p-3 text-right transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className={`${labelClass} text-brand-strong`}>
            {en ? 'Next story →' : 'अर्को समाचार →'}
          </span>
          <span className="line-clamp-2 font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
            {en && nextStory.titleEn ? nextStory.titleEn : nextStory.titleNe}
          </span>
        </Link>
      ) : null}
    </nav>
  )
}
