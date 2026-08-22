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

function PhotoImage({
  story,
  locale,
  sizes,
  priority = false,
}: {
  story: StoryCardData
  locale: Locale
  sizes: string
  priority?: boolean
}) {
  const src = story.heroImage?.url
  const title = titleFor(story, locale)

  if (!src || src.startsWith('data:')) {
    return <span className="absolute inset-0 bg-brand-tint" aria-hidden="true" />
  }

  return (
    <Image
      src={src}
      alt={story.heroImage?.alt || title}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.018]"
    />
  )
}

export default async function PhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items: photoStories } = await getStories({ locale, hasGallery: true, perPage: 14 })
  const [lead, second, third, ...archive] = photoStories
  const rail = [second, third].filter((story): story is StoryCardData => Boolean(story))

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8" lang={lang}>
      <HubIndexHeader
        title={en ? 'Photo stories' : 'फोटो कथा'}
        lead={
          en
            ? 'Photojournalism and field reporting arranged as a visual desk, with the image carrying the first read.'
            : 'फोटो पत्रकारिता र फिल्ड रिपोर्टिङको दृश्य डेस्क। पहिलो पढाइ तस्बिरबाट सुरु हुन्छ।'
        }
        lang={lang}
      />

      {lead ? (
        <>
          <section className="photo-desk" aria-labelledby="photo-desk-lead">
            <Link
              href={localizeHref(locale, `/photos/${lead.slug}`)}
              className="photo-desk__lead group"
            >
              <div className="photo-desk__lead-media">
                <PhotoImage
                  story={lead}
                  locale={locale}
                  sizes="(min-width: 1024px) 66vw, 100vw"
                  priority
                />
                <span className="photo-desk__count" aria-hidden="true">
                  01
                </span>
              </div>
              <div className="photo-desk__lead-copy">
                <p>{lead.categoryLabel}</p>
                <h2 id="photo-desk-lead">{titleFor(lead, locale)}</h2>
                {deckFor(lead, locale) ? <span>{deckFor(lead, locale)}</span> : null}
                <small>
                  {lead.byline} · {formatDate(lead.publishedAt, locale)}
                </small>
              </div>
            </Link>

            {rail.length ? (
              <ol className="photo-desk__rail">
                {rail.map((story, index) => (
                  <li key={story.id}>
                    <Link href={localizeHref(locale, `/photos/${story.slug}`)} className="group">
                      <div className="photo-desk__rail-media">
                        <PhotoImage
                          story={story}
                          locale={locale}
                          sizes="(min-width: 1024px) 32vw, 50vw"
                        />
                      </div>
                      <span className="photo-desk__rail-index" aria-hidden="true">
                        {String(index + 2).padStart(2, '0')}
                      </span>
                      <h3>{titleFor(story, locale)}</h3>
                      <p>{formatDate(story.publishedAt, locale)}</p>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : null}
          </section>

          {archive.length ? (
            <section className="photo-contact-sheet" aria-labelledby="photo-contact-title">
              <header>
                <h2 id="photo-contact-title">{en ? 'More photo reports' : 'थप फोटो रिपोर्ट'}</h2>
                <p>{en ? 'Recent visual reporting' : 'हालका दृश्य रिपोर्ट'}</p>
              </header>
              <ol>
                {archive.map((story, index) => (
                  <li key={story.id}>
                    <Link href={localizeHref(locale, `/photos/${story.slug}`)} className="group">
                      <div className="photo-contact-sheet__media">
                        <PhotoImage
                          story={story}
                          locale={locale}
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        />
                      </div>
                      <span aria-hidden="true">{String(index + 4).padStart(2, '0')}</span>
                      <h3>{titleFor(story, locale)}</h3>
                      <p>
                        {story.categoryLabel} · {formatDate(story.publishedAt, locale)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      ) : (
        <div className="mt-6 border-y border-rule bg-brand-tint px-4 py-8">
          <p className="font-display text-h2 text-ink">
            {en ? 'No photo stories yet' : 'अहिलेसम्म फोटो कथा छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {en
              ? 'Visual reports will appear here after the newsroom publishes a gallery.'
              : 'न्यूजरुमले ग्यालेरी प्रकाशित गरेपछि दृश्य रिपोर्ट यहाँ देखिनेछन्।'}
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
    title: locale === 'en' ? 'Photo Stories' : 'फोटो कथा',
    alternates: { canonical: `${prefix}/photos`, languages: { ne: '/photos', en: '/en/photos' } },
  }
}
