'use client'

import { cn } from '@nagarikwatch/ui'
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

type OverlayDialogProps = {
  open: boolean
  onClose: () => void
  id?: string
  ariaLabel?: string
  labelledBy?: string
  describedBy?: string
  variant: 'navigation' | 'search' | 'preferences'
  className?: string
  children: ReactNode
  closeOnBackdrop?: boolean
}

export function OverlayDialog({
  open,
  onClose,
  id,
  ariaLabel,
  labelledBy,
  describedBy,
  variant,
  className,
  children,
  closeOnBackdrop = true,
}: OverlayDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    document.documentElement.classList.add('nw-dialog-open')
    return () => document.documentElement.classList.remove('nw-dialog-open')
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (dialog.open) return
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (typeof dialog.showModal === 'function') {
        dialog.showModal()
      } else {
        dialog.setAttribute('open', '')
      }
      return
    }

    if (!dialog.open) return
    if (typeof dialog.close === 'function') {
      dialog.close()
    } else {
      dialog.removeAttribute('open')
    }
  }, [open])

  function restoreFocus() {
    const target = restoreFocusRef.current
    restoreFocusRef.current = null
    if (!target?.isConnected) return
    window.requestAnimationFrame(() => target.focus())
  }

  function handleClose() {
    restoreFocus()
    if (open) onClose()
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (!closeOnBackdrop || event.target !== event.currentTarget) return
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-variant={variant}
      className={cn('nw-dialog', className)}
      onClose={handleClose}
      onClick={handleBackdropClick}
    >
      {children}
    </dialog>
  )
}
