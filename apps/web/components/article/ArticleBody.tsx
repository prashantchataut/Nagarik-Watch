import Image from 'next/image'
import Link from 'next/link'
import type { ArticleBlock, Locale, SourceAttribution, Tag } from '@nagarikwatch/db'
import { RichInlineText } from '@/components/article/RichInlineText'
import { cn, CorrectionNotice as UiCorrectionNotice } from '@nagarikwatch/ui'
import { AttributionLine } from './AttributionLine'
import { AdSlot } from '@/components/AdSlot'
import { isAdPlacementKey } from '@/lib/ads'
import { localizeHref } from '@/lib/i18n/locales'

export { UiCorrectionNotice as CorrectionNotice }

type ArticleBodyProps = {
  blocks: ArticleBlock[]
  locale: Locale
  /** Provenance for aggregated/wire stories; original/undefined renders nothing. */
  source?: SourceAttribution
  className?: string
  /** When true, skip injected and body adSlot blocks (sensitive / adFree articles). */
  suppressAds?: boolean
}

/** Paragraph index after which the in-article ad slot is injected. */
const AD_AFTER_PARAGRAPH = 4

/**
 * Renders an article body as typed React, never raw HTML. Each block maps to one element
 * with the right semantic and lang attribute. Pull-quotes use a brand-tinted surface with
 * no side-stripe (impeccable ban); embeds are lazy iframes; lists keep their order.
 *
 * After the 4th paragraph a reserved 300x250 ad slot is injected so the ad never causes
 * layout shift (size is fixed up front) and is labeled reader-facing (ADR-006).
 */
export function ArticleBody({
  blocks,
  locale,
  source,
  className,
  suppressAds = false,
}: ArticleBodyProps) {
  let paragraphCount = 0
  let adInjected = false

  const out: React.ReactNode[] = []

  blocks.forEach((block, i) => {
    out.push(
      <BlockRenderer key={`b-${i}`} block={block} locale={locale} suppressAds={suppressAds} />,
    )
    if (!suppressAds && block.type === 'paragraph') {
      paragraphCount += 1
      if (!adInjected && paragraphCount >= AD_AFTER_PARAGRAPH && blocks.length > 6) {
        out.push(
          <AdSlot
            key={`ad-${i}`}
            locale={locale}
            placementKey="article-inline-1"
            variant="inline"
          />,
        )
        adInjected = true
      }
    }
  })

  return (
    <div className={cn('reading-scale space-y-6', className)} data-narrator-body="true">
      {source && <AttributionLine source={source} locale={locale} />}
      {out}
    </div>
  )
}

export function TagRow({
  tags,
  locale,
  className,
}: {
  tags: Tag[]
  locale: Locale
  className?: string
}) {
  if (!tags.length) return null
  const lang = locale === 'en' ? 'en' : 'ne'
  const label = locale === 'en' ? 'Topics' : 'विषय'
  return (
    <nav
      className={cn('flex flex-wrap items-center gap-2', className)}
      aria-label={label}
      lang={lang}
    >
      <span className="mr-2 text-meta font-semibold text-ink-soft">{label}</span>
      {tags.map((tag) => {
        const name = locale === 'en' && tag.nameEn ? tag.nameEn : tag.nameNe
        return (
          <Link
            key={tag.slug}
            href={localizeHref(locale, `/tag/${tag.slug}`)}
            className="border-b border-transparent text-body font-semibold text-ink-soft transition hover:border-brand hover:text-brand-strong"
          >
            {name}
          </Link>
        )
      })}
    </nav>
  )
}

function BlockRenderer({
  block,
  locale,
  suppressAds = false,
}: {
  block: ArticleBlock
  locale: Locale
  suppressAds?: boolean
}) {
  const lang = locale === 'en' ? 'en' : 'ne'
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-body-lg leading-[1.7] text-ink" lang={lang}>
          <RichInlineText text={block.text} />
        </p>
      )

    case 'heading2':
      return (
        <h2 className="pt-5 font-display text-h2 leading-tight text-ink" lang={lang}>
          <RichInlineText text={block.text} />
        </h2>
      )

    case 'heading3':
      return (
        <h3 className="pt-4 font-display text-h3 leading-tight text-ink" lang={lang}>
          <RichInlineText text={block.text} />
        </h3>
      )

    case 'image':
      return (
        <figure className="my-2">
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={block.image.url}
              alt={block.image.alt}
              fill
              unoptimized={block.image.url.startsWith('data:')}
              sizes="(min-width: 768px) 680px, 100vw"
              className="object-cover"
            />
          </div>
          {(block.caption || block.image.credit) && (
            <figcaption className="mt-2 text-caption text-ink-soft" lang={lang}>
              {block.caption}
              {block.caption && block.image.credit ? ' ' : ''}
              {block.image.credit ? <span className="text-mute">{block.image.credit}</span> : null}
            </figcaption>
          )}
        </figure>
      )

    case 'pullQuote': {
      const quote = locale === 'en' && block.quoteEn ? block.quoteEn : block.quoteNe
      const quoteLang = locale === 'en' && block.quoteEn ? 'en' : 'ne'
      return (
        <blockquote
          className="my-5 border border-rule bg-brand-tint px-4 py-4 sm:px-5 sm:py-5"
          lang={quoteLang}
        >
          <p className="font-display text-body-lg font-bold leading-snug text-ink sm:text-h3">
            <RichInlineText text={quote} />
          </p>
          {block.attribution && (
            <footer className="mt-2.5 text-meta font-semibold text-brand-strong">
              <cite className="not-italic">{block.attribution}</cite>
            </footer>
          )}
        </blockquote>
      )
    }

    case 'embed':
      return <Embed block={block} locale={locale} />

    case 'list': {
      const items = block.items.map((it, idx) => (
        <li key={idx} lang={lang} className="text-body-lg leading-[1.7] text-ink">
          <RichInlineText text={it} />
        </li>
      ))
      return block.ordered ? (
        <ol className="ml-6 list-decimal space-y-2">{items}</ol>
      ) : (
        <ul className="ml-6 list-disc space-y-2">{items}</ul>
      )
    }

    case 'adSlot': {
      if (suppressAds) return null
      const placementKey = isAdPlacementKey(block.placementKey)
        ? block.placementKey
        : 'article-inline-1'
      return <AdSlot locale={locale} placementKey={placementKey} variant="inline" />
    }

    default: {
      const _exhaustive: never = block
      void _exhaustive
      return null
    }
  }
}

function Embed({
  block,
  locale,
}: {
  block: Extract<ArticleBlock, { type: 'embed' }>
  locale: Locale
}) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const embedUrl = safeEmbedUrl(block.provider, block.url)
  if (!embedUrl) return null
  const isYouTube = block.provider === 'youtube'
  const title = block.caption ?? (isYouTube ? 'YouTube video' : 'Embedded media')
  return (
    <figure className="my-2">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-rule">
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; encrypted-media; gyroscope; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-caption text-ink-soft" lang={lang}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

function safeEmbedUrl(
  provider: Extract<ArticleBlock, { type: 'embed' }>['provider'],
  rawUrl: string,
) {
  try {
    const url = new URL(rawUrl)
    if (provider === 'youtube') {
      if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
        const id = url.searchParams.get('v')
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }
      if (url.hostname === 'youtu.be') {
        const id = url.pathname.replace(/^\//, '')
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }
      if (url.hostname === 'www.youtube-nocookie.com' && url.pathname.startsWith('/embed/')) {
        return url.toString()
      }
    }
    if (
      provider === 'twitter' &&
      ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'].includes(url.hostname)
    ) {
      return url.toString()
    }
    if (provider === 'facebook' && ['facebook.com', 'www.facebook.com'].includes(url.hostname)) {
      return url.toString()
    }
  } catch {
    return null
  }
  return null
}
