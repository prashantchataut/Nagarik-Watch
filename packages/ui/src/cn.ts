import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes safely (later classes win on conflicts) while keeping clsx's
 * conditional/object support. The canonical helper used across the codebase — see the
 * SPEC.md code-style snippet.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
