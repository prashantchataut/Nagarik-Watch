import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'

export const revalidate = 300

export default async function VideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items: videoStories } = await getStories({ locale, hasVideo: true, perPage: 12 })

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <h1 className="font-display text-h1 text-ink sm:text-display" lang={lang}>
          {en ? 'Video Reports' : 'भिडियो रिपोर्ट'}
        </h1>
        <p className="mt-2 max-w-body text-body text-ink-soft" lang={lang}>
          {en
            ? 'Recorded interviews, explainers and visual reports published by the newsroom.'
            : 'न्यूजरुमले प्रकाशित गरेका अन्तर्वार्ता, व्याख्या र दृश्य रिपोर्ट।'}
        </p>
      </header>

      {videoStories.length > 0 ? (
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {videoStories.map((story, index) => (
            <StoryCard
              key={story.slug}
              story={story}
              locale={locale}
              variant={index === 0 ? 'featured' : 'horizontal'}
              priority={index === 0}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 border-y border-rule py-8 text-body text-ink-soft" lang={lang}>
          {en
            ? 'No video reports have been published yet.'
            : 'अहिलेसम्म भिडियो रिपोर्ट प्रकाशित गरिएको छैन।'}
        </p>
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
