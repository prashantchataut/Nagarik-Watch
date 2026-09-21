/**
 * `scrollIntoView({ behavior: 'smooth' })` ignores `prefers-reduced-motion`:
 * the CSS media query cannot reach a scroll the script requests directly, so a
 * reader who asked the OS not to animate still gets a smooth scroll. Ask the
 * same query here and fall back to an instant jump.
 */
export function scrollIntoViewRespectingMotion(
  element: Element | null | undefined,
  options: Omit<ScrollIntoViewOptions, 'behavior'> = {},
): void {
  if (!element) return
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollIntoView({ ...options, behavior: reduced ? 'auto' : 'smooth' })
}
