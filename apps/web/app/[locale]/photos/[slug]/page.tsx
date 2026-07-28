import { staticPhotoParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getArticleBySlug } from '@/lib/content'
import { imageGalleryJsonLd } from '@/lib/json-ld'
import { SITE_URL } from '@/lib/site'
import { formatDate } from '@nagarikwatch/db'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const dynamic = 'force-static'

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
      <HubIndexHeader
        title={title}
        lead={
          deck ||
          (en
            ? 'A photo gallery selected from the reporting page.'
            : 'समाचार पृष्ठबाट छानिएको फोटो ग्यालेरी।')
        }
        lang={en ? 'en' : 'ne'}
        kicker={en ? 'Photo gallery' : 'फोटो ग्यालेरी'}
      />
      <div className="mt-4 flex flex-wrap items-center gap-3 text-meta text-ink-soft">
        <p>{formatDate(article.publishedAt, locale)}</p>
        <Link
          href={localizeHref(locale, `/${article.category.slug}/${article.slug}`)}
          className="border-b border-rule pb-1 font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
        >
          {en ? 'Open article page' : 'समाचार पृष्ठ खोल्नुहोस्'}
        </Link>
      </div>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2">
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
                <figcaption className="mt-2 max-w-body text-caption leading-relaxed text-ink-soft">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ol>
    </article>
  )
}

export function generateStaticParams() {
  return staticPhotoParams()
}
