import { cn } from './cn'

/**
 * LiveWidget — the shared shell for every reader-facing live-data module (weather, AQI,
 * NEPSE, sports score, election count, disaster level, …). It owns the *chrome* and the
 * *trust affordances* so individual widgets only supply their value markup:
 *
 *   - a title,
 *   - a source line + relative "last updated" label (every live value must show provenance,
 *     PRODUCT.md: reader trust above all),
 *   - a MOCK / नमुना badge whenever the value is placeholder data, so readers are never
 *     misled into treating it as reporting,
 *   - first-class loading, error, and empty states (the spec requires all three on every
 *     live widget; without them a feed outage silently shows stale or blank numbers).
 *
 * It is flat and typographic (DESIGN.md §6 elevation: news stays flat, not app-like). No
 * gradients, no glass, no side-stripe accents (impeccable bans). `tone` only tints the
 * thin top hairline + title, used sparingly for live/breaking/market states.
 */
export type LiveWidgetStatus = 'ok' | 'loading' | 'error' | 'empty'
export type LiveWidgetTone = 'default' | 'live' | 'up' | 'down'

type LiveWidgetProps = {
  /** Short title, e.g. "मौसम" / "NEPSE". Caller sets `lang` via titleLang. */
  title: string
  titleLang?: string
  status?: LiveWidgetStatus
  /** Provenance, shown in the footer. */
  source?: string
  /** Pre-formatted relative time ("५ मिनेटअघि" / "5 min ago"). */
  updatedLabel?: string
  /** When true, renders the placeholder badge. */
  mock?: boolean
  /** Localized strings (kept out of the UI package, passed in). */
  labels: {
    mock: string
    sourcePrefix: string
    loading: string
    error: string
    empty: string
    retry?: string
  }
  /** Optional icon node (Lucide-style line icon, 16–20px). */
  icon?: React.ReactNode
  /** Optional href that makes the whole title row a link (e.g. to the market page). */
  href?: string
  tone?: LiveWidgetTone
  className?: string
  children?: React.ReactNode
}

const toneAccent: Record<LiveWidgetTone, string> = {
  default: 'before:bg-rule',
  live: 'before:bg-breaking',
  up: 'before:bg-[var(--up)]',
  down: 'before:bg-[var(--down)]',
}

export function LiveWidget({
  title,
  titleLang,
  status = 'ok',
  source,
  updatedLabel,
  mock = false,
  labels,
  icon,
  href,
  tone = 'default',
  className,
  children,
}: LiveWidgetProps) {
  const titleRow = (
    <span className="flex min-w-0 items-center gap-1.5">
      {icon ? (
        <span className="shrink-0 text-ink-soft" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span
        className="truncate text-meta font-semibold uppercase tracking-wide text-ink-soft"
        lang={titleLang}
      >
        {title}
      </span>
    </span>
  )

  return (
    <section
      className={cn(
        // A 2px top hairline carries the tone; never a left/right side stripe (impeccable ban).
        'relative flex flex-col rounded-md border border-rule bg-surface-raised p-3',
        'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-md',
        toneAccent[tone],
        className,
      )}
      aria-busy={status === 'loading'}
    >
      <div className="flex items-center justify-between gap-2">
        {href ? (
          <a
            href={href}
            className="min-w-0 rounded-sm transition-opacity duration-fast ease-out-quint hover:opacity-80"
          >
            {titleRow}
          </a>
        ) : (
          titleRow
        )}
        {mock ? (
          <span
            className="shrink-0 rounded-full bg-brand-tint px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-brand-strong"
            title={labels.mock}
          >
            {labels.mock}
          </span>
        ) : null}
      </div>

      <div className="mt-1.5 flex-1">
        {status === 'loading' ? (
          <p className="text-meta text-mute" role="status">
            {labels.loading}
          </p>
        ) : status === 'error' ? (
          <p className="text-meta text-mute">{labels.error}</p>
        ) : status === 'empty' ? (
          <p className="text-meta text-mute">{labels.empty}</p>
        ) : (
          children
        )}
      </div>

      {(source || updatedLabel) && status === 'ok' ? (
        <p className="mt-1.5 truncate text-caption text-mute">
          {source ? `${labels.sourcePrefix}: ${source}` : ''}
          {source && updatedLabel ? ' · ' : ''}
          {updatedLabel ?? ''}
        </p>
      ) : null}
    </section>
  )
}
