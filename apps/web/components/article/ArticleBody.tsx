import Image from 'next/image'
import Link from 'next/link'
import type { ArticleBlock, Locale, SourceAttribution } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { cn } from '@nagarikwatch/ui'
import { AttributionLine } from './AttributionLine'

type ArticleBodyProps = {
  blocks: ArticleBlock[]
  locale: Locale
  /** Provenance for aggregated/wire stories; original/undefined renders nothing. */
  source?: SourceAttribution
  className?: string
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
export function ArticleBody({ blocks, locale, source, className }: ArticleBodyProps) {
  const dict = getDictionary(locale)
  let paragraphCount = 0
  let adInjected = false
  let firstParagraphRendered = false

  const out: React.ReactNode[] = []

  blocks.forEach((block, i) => {
    const isFirstParagraph = !firstParagraphRendered && block.type === 'paragraph'
    if (isFirstParagraph) firstParagraphRendered = true
    out.push(<BlockRenderer key={`b-${i}`} block={block} locale={locale} dropCap={isFirstParagraph} />)
    if (block.type === 'paragraph') {
      paragraphCount += 1
      if (!adInjected && paragraphCount >= AD_AFTER_PARAGRAPH) {
        out.push(
          <AdSlot key={`ad-${i}`} label={dict.adLabel} lang={locale === 'en' ? 'en' : 'ne'} />,
        )
        adInjected = true
      }
    }
  })

  return (
    <div className={cn('space-y-6', className)}>
      {source && <AttributionLine source={source} locale={locale} />}
      {out}
    </div>
  )
}

function BlockRenderer({ block, locale, dropCap }: { block: ArticleBlock; locale: Locale; dropCap?: boolean }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  switch (block.type) {
    case 'paragraph':
      if (dropCap && block.text.length > 1) {
        const first = block.text[0]!
        const rest = block.text.slice(1)
        return (
          <p className="text-[1.2rem] leading-[1.9] text-ink sm:text-[1.26rem]" lang={lang}>
            <span className="float-left mr-2 mt-1 font-display text-[3.5rem] leading-[0.8] text-brand">{first}</span>
            {rest}
          </p>
        )
      }
      return (
        <p className="text-[1.2rem] leading-[1.9] text-ink sm:text-[1.26rem]" lang={lang}>
          {block.text}
        </p>
      )

    case 'heading2':
      return (
        <h2 className="pt-5 font-display text-h2 leading-tight text-ink" lang={lang}>
          {block.text}
        </h2>
      )

    case 'heading3':
      return (
        <h3 className="pt-4 font-display text-h3 leading-tight text-ink" lang={lang}>
          {block.text}
        </h3>
      )

    case 'image':
      return (
        <figure className="my-2">
          <div className="relative overflow-hidden rounded-lg aspect-[16/9]">
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
        <blockquote className="my-4 border-y-2 border-brand py-6" lang={quoteLang}>
          <p className="font-display text-h2 leading-tight text-ink">{quote}</p>
          {block.attribution && (
            <footer className="mt-3 text-meta font-semibold uppercase tracking-wide text-brand-strong">
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
        <li key={idx} lang={lang} className="text-[1.2rem] leading-[1.9] text-ink sm:text-[1.26rem]">
          {it}
        </li>
      ))
      return block.ordered ? (
        <ol className="ml-6 list-decimal space-y-2">{items}</ol>
      ) : (
        <ul className="ml-6 list-disc space-y-2">{items}</ul>
      )
    }

    case 'adSlot':
      return null

    default:
      return null
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

/** Reserved-size ad container (300x250). Labeled reader-facing; lazy-filled later. */
function AdSlot({ label, lang }: { label: string; lang: 'ne' | 'en' }) {
  return (
    <aside
      className="ad-slot my-8 flex min-h-[250px] flex-col items-center justify-center gap-2 p-4"
      aria-label={label}
      lang={lang}
    >
      <span className="text-caption uppercase tracking-wide text-ink-soft">{label}</span>
      <span className="text-caption text-mute" lang="en">
        300 × 250
      </span>
    </aside>
  )
}

// Re-export so the page can drop a CorrectionNotice block in the right place.
export { CorrectionNotice }

type CorrectionNoticeProps = {
  corrections: { at: string; summaryNe: string; summaryEn?: string }[]
  locale: Locale
  className?: string
}

function CorrectionNotice({ corrections, locale, className }: CorrectionNoticeProps) {
  if (corrections.length === 0) return null
  const dict = getDictionary(locale)
  return (
    <aside
      className={cn('rounded-lg border border-rule bg-surface-raised px-5 py-4', className)}
      aria-label={dict.correctionsHeading}
    >
      <p
        className="text-meta font-bold uppercase tracking-wide text-brand-strong"
        lang={locale === 'en' ? 'en' : 'ne'}
      >
        {dict.correctionsHeading}
      </p>
      <ul className="mt-2 space-y-2">
        {corrections.map((c, i) => {
          const summary = locale === 'en' && c.summaryEn ? c.summaryEn : c.summaryNe
          const sumLang = locale === 'en' && c.summaryEn ? 'en' : 'ne'
          return (
            <li key={i} className="text-body text-ink-soft" lang={sumLang}>
              <time dateTime={c.at} className="font-semibold text-ink">
                {dict.correctedAt}:
              </time>{' '}
              {summary}
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

// Tags row used at the foot of an article.
export function TagRow({
  tags,
  locale,
  className,
}: {
  tags: { slug: string; nameNe: string; nameEn?: string }[]
  locale: Locale
  className?: string
}) {
  if (tags.length === 0) return null
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((t) => {
        const name = locale === 'en' && t.nameEn ? t.nameEn : t.nameNe
        const lang = locale === 'en' && t.nameEn ? 'en' : 'ne'
        const href = `${locale === 'en' ? '/en' : ''}/topic/${t.slug}`
        return (
          <li key={t.slug}>
            <Link
              href={href}
              className="inline-flex items-center rounded-full border border-rule px-3.5 py-1 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
              lang={lang}
            >
              #{name}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
