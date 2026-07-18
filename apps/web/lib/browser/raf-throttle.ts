/**
 * Coalesce high-frequency browser events (scroll/resize) to one callback per
 * animation frame. Guarantees the latest invocation runs, and exposes cancel
 * for effect cleanup.
 */

export type RafThrottled<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void
  flush: () => void
}

export function rafThrottle<Args extends unknown[]>(
  fn: (...args: Args) => void,
): RafThrottled<Args> {
  let frame = 0
  let latest: Args | null = null

  const run = () => {
    frame = 0
    if (!latest) return
    const args = latest
    latest = null
    fn(...args)
  }

  const throttled = ((...args: Args) => {
    latest = args
    if (frame) return
    frame =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame(run)
        : (setTimeout(run, 16) as unknown as number)
  }) as RafThrottled<Args>

  throttled.cancel = () => {
    if (!frame) return
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
    else clearTimeout(frame)
    frame = 0
    latest = null
  }

  throttled.flush = () => {
    if (!frame && !latest) return
    if (frame) {
      if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame)
      else clearTimeout(frame)
      frame = 0
    }
    run()
  }

  return throttled
}
