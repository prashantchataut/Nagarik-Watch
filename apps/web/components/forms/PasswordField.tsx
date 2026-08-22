'use client'

import { useId, useState } from 'react'

type PasswordFieldProps = {
  name: string
  label: string
  autoComplete: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  helpText?: string
  showLabel?: string
  hideLabel?: string
  /** Reader and newsroom variants share flat controls; the variant only changes emphasis. */
  variant?: 'reader' | 'newsroom'
}

export function PasswordField({
  name,
  label,
  autoComplete,
  disabled,
  required,
  placeholder = '••••••••',
  helpText,
  showLabel = 'Show',
  hideLabel = 'Hide',
  variant = 'reader',
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const helpId = helpText ? `${id}-help` : undefined
  const buttonLabel = visible ? hideLabel : showLabel
  const newsroom = variant === 'newsroom'

  return (
    <div className="grid gap-1.5 text-meta font-semibold text-ink">
      <label htmlFor={id}>{label}</label>
      <div
        className={
          newsroom
            ? 'flex border border-rule bg-surface focus-within:border-brand'
            : 'flex border border-rule bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-tint'
        }
      >
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={helpId}
          inputMode="text"
          className={
            newsroom
              ? 'min-h-11 min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:outline-none disabled:opacity-60'
              : 'min-h-11 min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:outline-none disabled:opacity-60'
          }
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          disabled={disabled}
          aria-pressed={visible}
          aria-label={buttonLabel}
          className={
            newsroom
              ? 'min-h-11 min-w-11 border-l border-rule px-3 text-caption font-bold uppercase tracking-wide text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-surface-raised hover:text-ink disabled:opacity-60'
              : 'min-h-11 min-w-16 border-l border-rule px-3 text-caption font-bold uppercase tracking-wide text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong disabled:opacity-60'
          }
        >
          {buttonLabel}
        </button>
      </div>
      {helpText ? (
        <p id={helpId} className="text-caption font-normal text-mute">
          {helpText}
        </p>
      ) : null}
    </div>
  )
}
