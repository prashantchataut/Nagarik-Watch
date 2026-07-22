import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { Locale, Article } from '@nagarikwatch/db'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { getArticleBySlug, getStories } from '@/lib/content'

export const revalidate = 300

export default async function PhotosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const { items } = await getStories({ locale, perPage: 40 })
  const articles = await Promise.all(
    items.map((story) => getArticleBySlug(story.category.slug, story.slug, locale)),
  )
  const photoStories = articles
    .filter((article): article is Article => Boolean(article && hasPhotoMaterial(article)))
    .slice(0, 12)

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={lang}
        >
          {en ? 'Photos' : 'फोटो'}
        </p>
        <h1 className="mt-1 font-display text-h1 text-ink sm:text-display" lang={lang}>
          {en ? 'Photo Stories' : 'फोटो कथा'}
        </h1>
        <p className="mt-2 max-w-body text-body text-ink-soft" lang={lang}>
          {en
            ? 'Photojournalism and visual stories selected by the newsroom.'
            : 'न्यूजरुमले छानेका फोटो पत्रकारिता र दृश्य कथा।'}
        </p>
      </header>

      {photoStories.length > 0 ? (
        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {photoStories.map((story, index) => {
            const title = en && story.titleEn ? story.titleEn : story.titleNe
            const href = localizeHref(locale, `/photos/${story.slug}`)
            const span = index === 0 ? 'md:col-span-2' : ''
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
                  ) : null}
                  <strong className="font-display text-h3 text-ink group-hover:text-brand-strong">
                    {title}
                  </strong>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <p
          className="mt-6 border-y border-rule py-8 text-body text-ink-soft"
          lang={lang}
        >
          {en
            ? 'No photo stories have been published yet.'
            : 'अहिलेसम्म फोटो कथा प्रकाशित गरिएको छैन।'}
        </p>
      )}
    </div>
  )
}

function hasPhotoMaterial(article: Article): boolean {
  if (article.heroImage?.url && !article.heroImage.url.startsWith('data:')) return true
  const blocks = article.language === 'en' && article.bodyEn ? article.bodyEn : article.bodyNe
  return blocks.some((block) => block.type === 'image')
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
