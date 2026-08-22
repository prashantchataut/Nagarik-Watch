import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate, type Locale, type StoryCardData } from '@nagarikwatch/db'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const revalidate = 300

function titleFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function hrefFor(story: StoryCardData, locale: Locale) {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

function RealImage({
  story,
  locale,
  priority = false,
}: {
  story: StoryCardData
  locale: Locale
  priority?: boolean
}) {
  const src = story.heroImage?.url
  if (!src || src.startsWith('data:'))
    return <div className="absolute inset-0 bg-brand-tint" aria-hidden="true" />
  return (
    <Image
      src={src}
      alt={story.heroImage?.alt || titleFor(story, locale)}
      fill
      priority={priority}
      sizes={priority ? '(min-width: 1280px) 900px, 100vw' : '(min-width: 768px) 50vw, 100vw'}
      className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
    />
  )
}

export default async function VideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items: videoStories } = await getStories({ locale, hasVideo: true, perPage: 14 })
  const [lead, ...rest] = videoStories
  const watchNext = rest.slice(0, 2)
  const notebook = rest.slice(2)

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8" lang={lang}>
      <HubIndexHeader
        title={en ? 'Video reports' : 'भिडियो रिपोर्ट'}
        lead={
          en
            ? 'Recorded interviews, explainers and field reporting, arranged as a watch desk rather than another article grid.'
            : 'रेकर्ड गरिएका अन्तर्वार्ता, व्याख्या र फिल्ड रिपोर्ट। साधारण समाचार ग्रिड होइन, हेर्ने क्रमअनुसारको भिडियो डेस्क।'
        }
        lang={lang}
      />

      {lead ? (
        <>
          <section className="mt-6 border-y border-rule py-5" aria-labelledby="video-lead-heading">
            <Link
              href={hrefFor(lead, locale)}
              className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <div className="relative aspect-video overflow-hidden bg-surface-raised">
                <RealImage story={lead} locale={locale} priority />
                <span
                  className="absolute bottom-0 left-0 grid h-14 w-14 place-items-center bg-brand text-paper"
                  aria-hidden="true"
                >
                  <span className="translate-x-[1px] text-lg">▶</span>
                </span>
              </div>
              <div className="mt-4 max-w-[62rem]">
                <p className="text-caption font-bold text-brand-strong">
                  {en ? 'Watch first' : 'पहिले हेर्नुहोस्'}
                </p>
                <h2
                  id="video-lead-heading"
                  className="mt-1 text-pretty font-display text-[clamp(2rem,4.5vw,3.9rem)] font-extrabold leading-[1.12] text-ink transition-colors group-hover:text-brand-strong"
                >
                  {titleFor(lead, locale)}
                </h2>
                {deckFor(lead, locale) ? (
                  <p className="mt-2 max-w-body text-body-lg leading-relaxed text-ink-soft">
                    {deckFor(lead, locale)}
                  </p>
                ) : null}
                <p className="mt-3 text-caption text-mute">
                  {formatDate(lead.publishedAt, locale)} · {lead.byline}
                </p>
              </div>
            </Link>
          </section>

          {watchNext.length > 0 ? (
            <section className="mt-7" aria-labelledby="watch-next-heading">
              <div className="flex items-end justify-between border-b border-rule pb-2">
                <div>
                  <p className="text-caption font-bold text-brand-strong">
                    {en ? 'Queue' : 'क्रम'}
                  </p>
                  <h2
                    id="watch-next-heading"
                    className="font-display text-h2 font-extrabold text-ink"
                  >
                    {en ? 'Watch next' : 'अब हेर्नुहोस्'}
                  </h2>
                </div>
                <p className="hidden max-w-sm text-right text-caption text-mute sm:block">
                  {en
                    ? 'Two visual reports selected to follow the lead.'
                    : 'मुख्य भिडियोपछि हेर्न मिल्ने दुई दृश्य रिपोर्ट।'}
                </p>
              </div>
              <div className="grid border-b border-rule md:grid-cols-2">
                {watchNext.map((story, index) => (
                  <article
                    key={story.id}
                    className={
                      index === 0
                        ? 'py-5 md:border-r md:pr-5'
                        : 'border-t border-rule py-5 md:border-t-0 md:pl-5'
                    }
                  >
                    <Link
                      href={hrefFor(story, locale)}
                      className="group grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] md:grid-cols-1"
                    >
                      <div className="relative aspect-video overflow-hidden bg-surface-raised">
                        <RealImage story={story} locale={locale} />
                        <span
                          className="absolute bottom-0 left-0 grid h-9 w-9 place-items-center bg-ink text-paper"
                          aria-hidden="true"
                        >
                          ▶
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display text-h3 font-extrabold leading-tight text-ink transition-colors group-hover:text-brand-strong">
                          {titleFor(story, locale)}
                        </h3>
                        {deckFor(story, locale) ? (
                          <p className="mt-1 line-clamp-2 text-body text-ink-soft">
                            {deckFor(story, locale)}
                          </p>
                        ) : null}
                        <p className="mt-2 text-caption text-mute">
                          {formatDate(story.publishedAt, locale)}
                        </p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {notebook.length > 0 ? (
            <section className="mt-8" aria-labelledby="video-notebook-heading">
              <div className="border-b border-rule pb-2">
                <p className="text-caption font-bold text-brand-strong">
                  {en ? 'Video notebook' : 'भिडियो नोटबुक'}
                </p>
                <h2
                  id="video-notebook-heading"
                  className="font-display text-h2 font-extrabold text-ink"
                >
                  {en ? 'More reporting to watch' : 'हेर्न बाँकी रिपोर्ट'}
                </h2>
              </div>
              <ol className="divide-y divide-rule">
                {notebook.map((story, index) => (
                  <li key={story.id}>
                    <Link
                      href={hrefFor(story, locale)}
                      className="group grid gap-3 py-4 sm:grid-cols-[2.25rem_minmax(0,1fr)_10rem] sm:items-center"
                    >
                      <span
                        className="hidden text-caption font-black tabular-nums text-brand-strong sm:block"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-[1.2rem] font-extrabold leading-tight text-ink transition-colors group-hover:text-brand-strong">
                          {titleFor(story, locale)}
                        </h3>
                        <p className="mt-1 text-caption text-mute">
                          {story.categoryLabel} · {formatDate(story.publishedAt, locale)}
                        </p>
                      </div>
                      <div className="relative aspect-video overflow-hidden bg-surface-raised">
                        <RealImage story={story} locale={locale} />
                        <span
                          className="absolute bottom-0 left-0 grid h-7 w-7 place-items-center bg-ink text-[0.65rem] text-paper"
                          aria-hidden="true"
                        >
                          ▶
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : (
        <div className="mt-6 border-y border-rule bg-brand-tint/35 px-4 py-8">
          <p className="font-display text-h2 text-ink">
            {en ? 'No video reports yet' : 'अहिलेसम्म भिडियो रिपोर्ट छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {en
              ? 'This desk opens when the newsroom publishes a verified video report.'
              : 'न्यूजरुमले प्रमाणित भिडियो रिपोर्ट प्रकाशित गरेपछि यो डेस्क खुल्छ।'}
          </p>
        </div>
      )}
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const prefix = localePrefix(locale)
  return {
    title: locale === 'en' ? 'Video Reports' : 'भिडियो रिपोर्ट',
    alternates: { canonical: `${prefix}/video`, languages: { ne: '/video', en: '/en/video' } },
  }
}
