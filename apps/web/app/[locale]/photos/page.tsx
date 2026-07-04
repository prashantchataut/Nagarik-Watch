import type { Metadata } from 'next'
import type { Locale, Article } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { getArticleBySlug, getStories } from '@/lib/content'

export const revalidate = 300

export default async function PhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items } = await getStories({ locale, perPage: 30 })
  const articles = await Promise.all(items.map((story) => getArticleBySlug(story.category.slug, story.slug, locale)))
  const photoStories = articles.filter((article): article is Article => Boolean(article && hasPhotoMaterial(article))).slice(0, 12)

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={lang}>{en ? 'Photos' : 'फोटो'}</p>
        <h1 className="mt-1 font-display text-h1 text-ink sm:text-display" lang={lang}>{en ? 'Photo Stories' : 'फोटो कथा'}</h1>
        <p className="mt-2 max-w-body text-body text-ink-soft" lang={lang}>{en ? 'Photojournalism and visual stories selected by the newsroom.' : 'न्यूजरुमले छानेका फोटो पत्रकारिता र दृश्य कथा।'}</p>
      </header>

      {photoStories.length > 0 ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {photoStories.map((story, index) => (
            <StoryCard key={story.slug} story={story} locale={locale} variant={index === 0 ? 'overlay' : 'default'} priority={index === 0} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-rule bg-surface-raised p-5 text-body text-ink-soft" lang={lang}>
          {en ? 'No photo stories have been published yet.' : 'अहिलेसम्म फोटो कथा प्रकाशित गरिएको छैन।'}
        </p>
      )}
    </div>
  )
}

function hasPhotoMaterial(article: Article): boolean {
  if (article.heroImage) return true
  const blocks = article.language === 'en' && article.bodyEn ? article.bodyEn : article.bodyNe
  return blocks.some((block) => block.type === 'image')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const prefix = localePrefix(locale)
  return {
    title: locale === 'en' ? 'Photo Stories' : 'फोटो कथा',
    alternates: { canonical: `${prefix}/photos`, languages: { ne: '/photos', en: '/en/photos' } },
  }
}
