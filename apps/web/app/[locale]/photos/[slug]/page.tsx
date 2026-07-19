import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getArticleBySlug, getStories } from '@/lib/content'
import { imageGalleryJsonLd } from '@/lib/json-ld'
import { SITE_URL } from '@/lib/site'
import { formatDate } from '@nagarikwatch/db'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = asLocale(raw)
  const article =
    (await getArticleBySlug('photo-story', slug, locale)) ||
    (await getArticleBySlug('photos', slug, locale))
  if (!article) return {}
  const title = locale === 'en' && article.titleEn ? article.titleEn : article.titleNe
  return {
    title,
    description: locale === 'en' ? article.deckEn || article.deckNe : article.deckNe,
    alternates: { canonical: `${SITE_URL}${localizeHref(locale, `/photos/${slug}`)}` },
  }
}

export default async function PhotoGalleryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = asLocale(raw)
  const en = locale === 'en'
  const article =
    (await getArticleBySlug('photo-story', slug, locale)) ||
    (await getArticleBySlug('photos', slug, locale))
  if (!article) notFound()

  const title = en && article.titleEn ? article.titleEn : article.titleNe
  const deck = en && article.deckEn ? article.deckEn : article.deckNe
  const images = [
    ...(article.heroImage
      ? [{ url: article.heroImage.url, caption: article.heroCaptionNe || article.heroImage.alt }]
      : []),
    ...((article.bodyNe || [])
      .filter((block) => block.type === 'image' && 'url' in block)
      .map((block) => ({
        url: String((block as { url: string }).url),
        caption: String((block as { caption?: string }).caption || ''),
      })) as Array<{ url: string; caption?: string }>),
  ].filter((image) => image.url && !image.url.startsWith('data:'))

  if (images.length === 0) notFound()

  const path = localizeHref(locale, `/photos/${slug}`)
  const jsonLd = imageGalleryJsonLd({
    title,
    path,
    description: deck,
    images,
  })

  return (
    <article className="mx-auto max-w-page px-4 pb-16 pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
        {en ? 'Photo gallery' : 'फोटो ग्यालेरी'}
      </p>
      <h1 className="mt-3 max-w-[20ch] font-display text-[clamp(2rem,5vw,3.5rem)] font-black text-ink">
        {title}
      </h1>
      {deck ? <p className="mt-4 max-w-[42rem] text-body-lg text-ink-soft">{deck}</p> : null}
      <p className="mt-3 text-meta text-mute">{formatDate(article.publishedAt, locale)}</p>
      <ol className="mt-10 grid gap-8 sm:grid-cols-2">
        {images.map((image, index) => (
          <li key={`${image.url}-${index}`} className="border-b border-rule pb-6">
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
                <Image
                  src={image.url}
                  alt={image.caption || title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  unoptimized={image.url.startsWith('data:')}
                />
              </div>
              {image.caption ? (
                <figcaption className="mt-2 text-caption text-ink-soft">{image.caption}</figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ol>
      <p className="mt-10">
        <Link
          href={localizeHref(locale, `/${article.category.slug}/${article.slug}`)}
          className="font-bold text-brand-strong underline-offset-2 hover:underline"
        >
          {en ? 'Open article page' : 'समाचार पृष्ठ खोल्नुहोस्'}
        </Link>
      </p>
    </article>
  )
}

export async function generateStaticParams() {
  const { items } = await getStories({ locale: 'ne', category: 'photo-story', perPage: 30 }).catch(
    () => ({ items: [] as Awaited<ReturnType<typeof getStories>>['items'] }),
  )
  return items.map((item) => ({ locale: 'ne', slug: item.slug }))
}
