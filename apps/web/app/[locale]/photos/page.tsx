import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const revalidate = 300

export default async function PhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items: photoStories } = await getStories({
    locale,
    hasGallery: true,
    perPage: 12,
  })

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <HubIndexHeader
        title={en ? 'Photo stories' : 'फोटो कथा'}
        lead={
          en
            ? 'Photojournalism, field images and visual reporting selected by the newsroom.'
            : 'न्यूजरुमले छानेका फोटो पत्रकारिता, फिल्ड छवि र दृश्य रिपोर्ट।'
        }
        lang={lang}
      />

      {photoStories.length > 0 ? (
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {photoStories.map((story, index) => {
            const title = en && story.titleEn ? story.titleEn : story.titleNe
            const href = localizeHref(locale, `/photos/${story.slug}`)
            const span = index === 0 ? 'md:col-span-2' : ''
            const deck = en && story.deckEn ? story.deckEn : story.deckNe
            return (
              <li key={story.slug} className={span}>
                <Link href={href} className="group block border-b border-rule pb-5">
                  {story.heroImage?.url && !story.heroImage.url.startsWith('data:') ? (
                    <div
                      className={`relative mb-3 overflow-hidden bg-surface-raised ${index === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}
                    >
                      <Image
                        src={story.heroImage.url}
                        alt={story.heroImage.alt || title}
                        fill
                        className="object-cover transition-transform duration-slow group-hover:scale-[1.02]"
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                    </div>
                  ) : (
                    <div
                      className={`mb-3 bg-brand-tint ${index === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-caption font-semibold text-mute" lang={lang}>
                    {story.categoryLabel}
                  </p>
                  <strong className="mt-1 block font-display text-h3 text-ink group-hover:text-brand-strong">
                    {title}
                  </strong>
                  {deck ? (
                    <p className="mt-1 line-clamp-2 max-w-body text-body text-ink-soft" lang={lang}>
                      {deck}
                    </p>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-6 border-y border-rule bg-brand-tint/35 px-4 py-8" lang={lang}>
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
