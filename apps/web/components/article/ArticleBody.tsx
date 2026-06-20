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

  const out: React.ReactNode[] = []

  blocks.forEach((block, i) => {
    out.push(<BlockRenderer key={`b-${i}`} block={block} locale={locale} />)
    if (block.type === 'paragraph') {
      paragraphCount += 1
      if (!adInjected && paragraphCount >= AD_AFTER_PARAGRAPH) {
        out.push(
          <AdSlot
            key={`ad-${i}`}
            label={dict.adLabel}
            lang={locale === 'en' ? 'en' : 'ne'}
          />,
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

function BlockRenderer({ block, locale }: { block: ArticleBlock; locale: Locale }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-body-lg leading-relaxed text-ink" lang={lang}>
          {block.text}
        </p>
      )

    case 'heading2':
      return (
        <h2 className="pt-2 font-display text-h2 text-ink" lang={lang}>
          {block.text}
        </h2>
      )

    case 'heading3':
      return (
        <h3 className="pt-2 font-display text-h3 text-ink" lang={lang}>
          {block.text}
        </h3>
      )

    case 'image':
      return (
        <figure className="my-2">
          <div className="relative overflow-hidden rounded-sm aspect-[16/9]">
            <Image
              src={block.image.url}
              alt={block.image.alt}
              fill
              sizes="(min-width: 768px) 680px, 100vw"
              className="object-cover"
            />
          </div>
          {(block.caption || block.image.credit) && (
            <figcaption className="mt-2 text-caption text-mute" lang={lang}>
              {block.caption}
              {block.caption && block.image.credit ? ' ' : ''}
              {block.image.credit ? (
                <span className="text-mute/80">{block.image.credit}</span>
              ) : null}
            </figcaption>
          )}
        </figure>
      )

    case 'pullQuote': {
      const quote = locale === 'en' && block.quoteEn ? block.quoteEn : block.quoteNe
      const quoteLang = locale === 'en' && block.quoteEn ? 'en' : 'ne'
      return (
        <blockquote
          className="my-2 rounded-sm bg-brand-tint px-6 py-5"
          lang={quoteLang}
        >
          <p className="font-display text-h3 leading-snug text-brand-strong">{quote}</p>
          {block.attribution && (
            <footer className="mt-3 text-meta font-semibold text-ink-soft">
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      )
    }

    case 'embed':
      return <Embed block={block} locale={locale} />

    case 'list': {
      const items = block.items.map((it, idx) => (
        <li key={idx} lang={lang} className="text-body-lg leading-relaxed text-ink">
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
  const isYouTube = block.provider === 'youtube'
  const title = block.caption ?? (isYouTube ? 'YouTube video' : 'Embedded media')
  return (
    <figure className="my-2">
      <div className="relative aspect-video overflow-hidden rounded-sm border border-rule">
        <iframe
          src={block.url}
          title={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; encrypted-media; gyroscope; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      {block.caption && (
        <figcaption className="mt-2 text-caption text-mute" lang={lang}>
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}

/** Reserved-size ad container (300x250). Labeled reader-facing; lazy-filled later. */
function AdSlot({ label, lang }: { label: string; lang: 'ne' | 'en' }) {
  return (
    <aside
      className="ad-slot my-2 flex min-h-[250px] flex-col items-center justify-center gap-2 p-4"
      aria-label={label}
      lang={lang}
    >
      <span className="text-caption uppercase tracking-wide text-mute">{label}</span>
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
      className={cn(
        'rounded-sm border border-rule bg-surface-raised px-5 py-4',
        className,
      )}
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
              className="inline-flex items-center rounded-sm border border-rule px-3 py-1 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
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
