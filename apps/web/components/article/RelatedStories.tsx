import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { CategoryLabel } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

/** Related coverage is sequenced, not rendered as another interchangeable card grid. */
export function RelatedStories({
  stories,
  locale,
  className,
}: {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}) {
  if (stories.length === 0) return null
  const dict = getDictionary(locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const [lead, ...rest] = stories.slice(0, 6)
  if (!lead) return null
  const title = en && lead.titleEn ? lead.titleEn : lead.titleNe
  const deck = en && lead.deckEn ? lead.deckEn : lead.deckNe
  const href = localizeHref(locale, `/${lead.category.slug}/${lead.slug}`)
  const image =
    lead.heroImage?.url && !lead.heroImage.url.startsWith('data:') ? lead.heroImage.url : null

  return (
    <section className={className} aria-label={dict.relatedStories}>
      <header className="border-b border-rule pb-2.5">
        <p className="text-caption font-bold text-brand-strong" lang={lang}>
          {en ? 'Continue the story' : 'सम्बन्धित कभरेज'}
        </p>
        <h2 className="mt-0.5 font-display text-h2 font-extrabold text-ink" lang={lang}>
          {en ? 'What to read next' : 'अब के पढ्ने'}
        </h2>
      </header>

      <div className="grid gap-5 py-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:gap-7">
        <article className="group grid gap-4 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {image ? (
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden="true"
              className="relative aspect-[16/10] overflow-hidden bg-surface-raised"
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 34vw, 45vw"
                className="object-cover"
              />
            </Link>
          ) : null}
          <div className="min-w-0">
            <CategoryLabel category={lead.category} locale={locale} as="span" />
            <h3
              className="mt-2 text-pretty font-display text-[clamp(1.45rem,2.5vw,2.05rem)] font-extrabold leading-[1.18] text-ink group-hover:text-brand-strong"
              lang={lang}
            >
              <Link href={href}>{title}</Link>
            </h3>
            {deck ? (
              <p className="mt-2 line-clamp-3 text-body leading-relaxed text-ink-soft">{deck}</p>
            ) : null}
          </div>
        </article>

        {rest.length > 0 ? (
          <ol className="border-t border-rule lg:border-l lg:border-t-0 lg:pl-5">
            {rest.map((story, index) => (
              <li
                key={story.id}
                className="grid grid-cols-[1.6rem_minmax(0,1fr)] gap-2.5 border-b border-rule py-3 first:pt-0 last:border-b-0"
              >
                <span
                  className="text-caption font-black tabular-nums text-brand-strong"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <DenseStoryItem
                  story={story}
                  locale={locale}
                  thumb={index < 2 ? 'sm' : 'none'}
                  showDeck={index === 0}
                  showMeta={index < 2}
                />
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  )
}
