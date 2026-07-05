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
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()
  const helpId = helpText ? `${id}-help` : undefined
  const buttonLabel = visible ? hideLabel : showLabel

  return (
    <div className="grid gap-1.5 text-meta font-semibold text-ink">
      <label htmlFor={id}>{label}</label>
      <div className="flex rounded-md border border-rule bg-surface focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-tint">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={helpId}
          className="min-w-0 flex-1 rounded-l-md bg-transparent px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          disabled={disabled}
          aria-pressed={visible}
          aria-label={buttonLabel}
          className="min-w-16 rounded-r-md border-l border-rule px-3 text-caption font-bold uppercase tracking-wide text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong disabled:opacity-60"
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
