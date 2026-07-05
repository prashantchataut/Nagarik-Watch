import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { localizeHref } from '@/lib/i18n/locales'
import { relativeTime } from '@/lib/live/format'

export async function FromWires({ locale, className }: { locale: Locale; className?: string }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const { items } = await getStories({ locale, perPage: 9 })
  const stories = items.slice(0, 7)

  if (stories.length === 0) return null

  const [lead, ...rest] = stories

  return (
    <section className={className} aria-label={locale === 'en' ? 'Nagarik Desk' : 'नागरिक डेस्क'}>
      <div className="flex items-end justify-between gap-4 border-b border-rule pb-3">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
            Nagarik Desk
          </p>
          <h2 className="mt-1 font-display text-h2 font-extrabold text-ink" lang={lang}>
            {locale === 'en' ? 'Fresh from Nagarik Watch' : 'नागरिक वाचबाट ताजा'}
          </h2>
        </div>
        <a
          href={localizeHref(locale, '/latest')}
          className="shrink-0 text-meta font-semibold text-ink-soft underline-offset-4 hover:text-brand-strong hover:underline"
          lang={lang}
        >
          {locale === 'en' ? 'All latest' : 'सबै ताजा'}
        </a>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.62fr)]">
        {lead ? <DeskLead story={lead} locale={locale} /> : null}
        <ol className="divide-y divide-rule border-y border-rule">
          {rest.map((story, index) => (
            <DeskItem key={story.id} story={story} index={index + 1} locale={locale} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function DeskLead({ story, locale }: { story: StoryCardData; locale: Locale }) {
  const lang = locale === 'en' && story.titleEn ? 'en' : 'ne'
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const deck = locale === 'en' && story.deckEn ? story.deckEn : story.deckNe
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)

  return (
    <article className="rounded-lg border border-rule bg-surface-raised p-5">
      <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong" lang={locale === 'en' ? 'en' : 'ne'}>
        {story.categoryLabel}
      </p>
      <h3 className="mt-3 font-display text-h1 font-extrabold leading-tight text-ink" lang={lang}>
        <a href={href} className="underline-offset-4 hover:text-brand-strong hover:underline">
          {title}
        </a>
      </h3>
      {deck ? (
        <p className="mt-3 text-body leading-relaxed text-ink-soft" lang={lang}>
          {deck}
        </p>
      ) : null}
      <p className="mt-5 text-caption text-mute" lang={locale === 'en' ? 'en' : 'ne'}>
        {locale === 'en' ? 'Nagarik Watch' : 'नागरिक वाच'} · {relativeTime(story.publishedAt, locale)}
      </p>
    </article>
  )
}

function DeskItem({ story, index, locale }: { story: StoryCardData; index: number; locale: Locale }) {
  const lang = locale === 'en' && story.titleEn ? 'en' : 'ne'
  const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)

  return (
    <li className="group grid grid-cols-[2.25rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
      <span className="pt-1 font-mono text-caption font-bold text-mute">{String(index).padStart(2, '0')}</span>
      <div>
        <a href={href} className="font-semibold leading-snug text-ink group-hover:text-brand-strong" lang={lang}>
          {title}
        </a>
        <p className="mt-1 text-caption text-mute" lang={locale === 'en' ? 'en' : 'ne'}>
          {story.categoryLabel} · {relativeTime(story.publishedAt, locale)}
        </p>
      </div>
    </li>
  )
}
