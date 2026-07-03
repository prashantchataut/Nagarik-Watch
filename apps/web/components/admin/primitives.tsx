import { cn } from '@nagarikwatch/ui'

/**
 * Shared admin UI primitives. Kept tiny and unstyled-by-default so each screen
 * can compose them without fighting a heavy component library. All colours
 * come from the Civic Crimson token system — no inline hex.
 */

export function AdminCard({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('rounded-lg border border-rule bg-surface-raised p-5', className)}>
      {children}
    </section>
  )
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-display leading-tight text-ink" lang="ne">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-body text-ink-soft" lang="ne">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

export function AdminButton({
  href,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className,
  title,
  children,
}: {
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  /** Native tooltip — used on disabled buttons to explain why. */
  title?: string
  children: React.ReactNode
}) {
  const cls = cn(
    'inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-meta font-semibold transition-colors duration-fast ease-out-quint focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    variant === 'primary' &&
      'bg-brand text-surface hover:bg-brand-strong',
    variant === 'secondary' &&
      'border border-rule text-ink hover:border-brand hover:text-brand-strong',
    variant === 'ghost' && 'text-ink-soft hover:bg-brand-tint hover:text-brand-strong',
    variant === 'danger' &&
      'border border-breaking/40 text-breaking hover:bg-breaking hover:text-surface',
    className,
  )
  if (href) {
    return (
      <a href={href} className={cls} title={title}>
        {children}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} title={title}>
      {children}
    </button>
  )
}

export function AdminInput({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  required,
  disabled,
  lang,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string | number
  placeholder?: string
  type?: string
  required?: boolean
  disabled?: boolean
  lang?: string
  hint?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-meta font-semibold text-ink" lang={lang ?? 'ne'}>
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        lang={lang}
        className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
      />
      {hint && (
        <span className="text-caption text-mute" lang={lang ?? 'ne'}>
          {hint}
        </span>
      )}
    </label>
  )
}

export function AdminTextarea({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  rows = 4,
  lang,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  rows?: number
  lang?: string
  hint?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-meta font-semibold text-ink" lang={lang ?? 'ne'}>
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        rows={rows}
        lang={lang}
        className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
      />
      {hint && (
        <span className="text-caption text-mute" lang={lang ?? 'ne'}>
          {hint}
        </span>
      )}
    </label>
  )
}

export function AdminSelect({
  label,
  name,
  defaultValue,
  options,
  required,
  lang,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  required?: boolean
  lang?: string
  hint?: string
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-meta font-semibold text-ink" lang={lang ?? 'ne'}>
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <span className="text-caption text-mute" lang={lang ?? 'ne'}>
          {hint}
        </span>
      )}
    </label>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'published'
      ? 'bg-brand-tint text-brand-strong'
      : status === 'draft'
        ? 'border border-rule text-mute'
        : status === 'submitted' || status === 'fact_check' || status === 'copy_edit'
          ? 'bg-gold/20 text-ink'
          : 'border border-rule text-ink-soft'
  const label =
    {
      published: 'प्रकाशित',
      draft: 'ड्राफ्ट',
      submitted: 'पेश',
      fact_check: 'तथ्य-जाँच',
      copy_edit: 'कपी',
      seo_review: 'एसइओ',
      legal_review: 'कानुन',
      ready: 'तयार',
      scheduled: 'तालिका',
      archived: 'अभिलेख',
      retracted: 'फिर्ता',
      idea: 'विचार',
      assigned: 'सौंपिएको',
      updated: 'अपडेट',
    }[status] ?? status
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-caption font-semibold', tone)} lang="ne">
      {label}
    </span>
  )
}

export function AdminEmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-surface-raised p-10 text-center">
      <p className="font-display text-h2 text-ink" lang="ne">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-body text-ink-soft" lang="ne">
        {body}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
