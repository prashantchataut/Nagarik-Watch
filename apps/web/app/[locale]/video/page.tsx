import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const revalidate = 300

export default async function VideoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items: videoStories } = await getStories({ locale, hasVideo: true, perPage: 12 })

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <HubIndexHeader
        title={en ? 'Video reports' : 'भिडियो रिपोर्ट'}
        lead={
          en
            ? 'Recorded interviews, explainers and visual reports published by the newsroom.'
            : 'न्यूजरुमले प्रकाशित गरेका अन्तर्वार्ता, व्याख्या र दृश्य रिपोर्ट।'
        }
        lang={lang}
      />

      {videoStories.length > 0 ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.9fr)]">
          <div className="min-w-0">
            <StoryCard story={videoStories[0]!} locale={locale} variant="featured" priority />
          </div>
          <div className="grid gap-4 border-t border-rule pt-4 lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
            {videoStories.slice(1).map((story) => (
              <StoryCard key={story.slug} story={story} locale={locale} variant="horizontal" />
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-6 border-y border-rule bg-brand-tint/35 px-4 py-8" lang={lang}>
          <p className="font-display text-h2 text-ink">
            {en ? 'No video reports yet' : 'अहिलेसम्म भिडियो रिपोर्ट छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {en
              ? 'Video interviews and explainers will appear here after publication.'
              : 'भिडियो अन्तर्वार्ता र व्याख्या प्रकाशित भएपछि यहाँ देखिनेछन्।'}
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
