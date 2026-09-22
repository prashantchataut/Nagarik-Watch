'use client'

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusablesIn(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null,
  )
}

/**
 * Modal behaviour for an element that already declares `role="dialog"` and
 * `aria-modal="true"`: lock background scroll, close on Escape, keep Tab inside
 * the panel, and return focus where it came from.
 *
 * The focusable list is re-read on every Tab rather than captured on open —
 * dialogs whose contents arrive asynchronously (a media grid still fetching)
 * would otherwise trap against boundaries that no longer exist.
 */
export function useFocusTrap(
  open: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  // Callers pass an inline `() => setOpen(false)`; keeping it in a ref stops a
  // new identity on every render from re-running the effect, which would
  // re-steal focus to the first control mid-interaction.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const returnFocusTo = document.activeElement as HTMLElement | null

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = focusablesIn(containerRef.current)
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          !containerRef.current?.contains(document.activeElement)
        ) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    focusablesIn(containerRef.current)[0]?.focus()
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      returnFocusTo?.focus?.()
    }
  }, [open, containerRef])
}
