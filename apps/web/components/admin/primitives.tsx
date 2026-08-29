import { cn } from '@nagarikwatch/ui'
import Link from 'next/link'

export function AdminCard({
  className,
  children,
  as = 'section',
}: {
  className?: string
  children: React.ReactNode
  as?: 'section' | 'div' | 'article'
}) {
  const Comp = as
  return <Comp className={cn('admin-panel', className)}>{children}</Comp>
}

/** Page toolbar below shell breadcrumb. Shell owns the visible page title. */
export function AdminPageHeader({
  subtitle,
  eyebrow,
  action,
}: {
  subtitle?: string
  eyebrow?: string
  action?: React.ReactNode
}) {
  if (!subtitle && !eyebrow && !action) return null
  return (
    <header className="admin-page-header">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="admin-eyebrow" lang="ne">
            {eyebrow}
          </p>
        ) : null}
        {subtitle ? (
          <p className="admin-page-subtitle" lang="ne">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 admin-page-header__action">{action}</div> : null}
    </header>
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
  target,
  rel,
  children,
}: {
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
  title?: string
  target?: string
  rel?: string
  children: React.ReactNode
}) {
  const cls = cn('admin-button', `admin-button--${variant}`, className)
  if (href)
    return (
      <Link href={href} className={cls} title={title} target={target} rel={rel}>
        {children}
      </Link>
    )
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} title={title}>
      {children}
    </button>
  )
}

export function AdminFilterLink({
  href,
  active,
  children,
  className,
}: {
  href: string
  active?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn('admin-filter-link', active && 'admin-filter-link--active', className)}
    >
      {children}
    </Link>
  )
}

export function AdminCallout({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: 'neutral' | 'attention' | 'danger'
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'admin-callout',
        tone === 'attention' && 'admin-callout--attention',
        tone === 'danger' && 'admin-callout--danger',
        className,
      )}
    >
      {children}
    </div>
  )
}

const fieldClass = 'admin-field-control'

export function AdminInput({
  label,
  name,
  id: idProp,
  defaultValue,
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  max,
  step,
  required,
  disabled,
  lang,
  hint,
}: {
  label: string
  name: string
  id?: string
  defaultValue?: string | number
  value?: string | number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  min?: number | string
  max?: number | string
  step?: number | string
  required?: boolean
  disabled?: boolean
  lang?: string
  hint?: string
}) {
  const id = idProp ?? `field-${name}`
  return (
    <label className="admin-field" htmlFor={id}>
      <span className="admin-field-label" lang={lang ?? 'ne'}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        min={min}
        max={max}
        step={step}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        lang={lang}
        className={fieldClass}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint ? (
        <span id={`${id}-hint`} className="admin-field-hint" lang={lang ?? 'ne'}>
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function AdminTextarea({
  label,
  name,
  id: idProp,
  defaultValue,
  value,
  onChange,
  placeholder,
  required,
  rows = 5,
  lang,
  hint,
}: {
  label: string
  name: string
  id?: string
  defaultValue?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  required?: boolean
  rows?: number
  lang?: string
  hint?: string
}) {
  const id = idProp ?? `field-${name}`
  return (
    <label className="admin-field" htmlFor={id}>
      <span className="admin-field-label" lang={lang ?? 'ne'}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <textarea
        id={id}
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        lang={lang}
        className={cn(fieldClass, 'min-h-28 resize-y')}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint ? (
        <span id={`${id}-hint`} className="admin-field-hint" lang={lang ?? 'ne'}>
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function AdminSelect({
  label,
  name,
  id: idProp,
  defaultValue,
  value,
  onChange,
  options,
  required,
  lang,
  hint,
}: {
  label: string
  name: string
  id?: string
  defaultValue?: string
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  required?: boolean
  lang?: string
  hint?: string
}) {
  const id = idProp ?? `field-${name}`
  return (
    <label className="admin-field" htmlFor={id}>
      <span className="admin-field-label" lang={lang ?? 'ne'}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      <select
        id={id}
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange}
        required={required}
        className={fieldClass}
        aria-describedby={hint ? `${id}-hint` : undefined}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <span id={`${id}-hint`} className="admin-field-hint" lang={lang ?? 'ne'}>
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'published'
      ? 'success'
      : status === 'retracted'
        ? 'danger'
        : status === 'scheduled' || status === 'ready'
          ? 'attention'
          : 'neutral'
  const labels: Record<string, string> = {
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
  }
  return (
    <span className={`admin-status admin-status--${tone}`} lang="ne">
      {labels[status] ?? status}
    </span>
  )
}

export function OpsCheckBadge({ status }: { status: 'pass' | 'warn' | 'fail' | string }) {
  const tone =
    status === 'pass'
      ? 'success'
      : status === 'warn'
        ? 'attention'
        : status === 'fail'
          ? 'danger'
          : 'neutral'
  const labels: Record<string, string> = {
    pass: 'ठीक',
    warn: 'सावधान',
    fail: 'असफल',
  }
  const label = labels[status] ?? String(status)
  return (
    <span className={`admin-status admin-status--${tone}`} lang="ne">
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
    <section className="admin-empty" aria-live="polite">
      <div className="admin-empty-mark" aria-hidden="true">
        ·
      </div>
      <h2 className="font-display text-h3 font-extrabold text-ink" lang="ne">
        {title}
      </h2>
      <span className="mx-auto mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
      <p
        className="mx-auto mt-2.5 max-w-xl text-meta leading-relaxed text-ink-soft sm:text-body"
        lang="ne"
      >
        {body}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  )
}

export function AdminMetric({
  href,
  value,
  label,
  tone = 'default',
}: {
  href?: string
  value: React.ReactNode
  label: string
  tone?: 'default' | 'brand' | 'danger'
}) {
  const valueClass = cn(
    'admin-metric__value',
    tone === 'brand' && 'admin-metric__value--brand',
    tone === 'danger' && 'admin-metric__value--danger',
  )
  const body = (
    <>
      <p className={valueClass}>{value}</p>
      <p className="admin-metric__label" lang="ne">
        {label}
      </p>
    </>
  )
  if (href) {
    return (
      <Link href={href} className="admin-metric">
        {body}
      </Link>
    )
  }
  return <div className="admin-metric">{body}</div>
}

export function AdminTable({
  children,
  minWidth,
  caption,
}: {
  children: React.ReactNode
  minWidth?: string
  caption?: string
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table" style={minWidth ? { minWidth } : undefined}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  )
}
