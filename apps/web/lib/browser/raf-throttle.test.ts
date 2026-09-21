import { afterEach, describe, expect, it, vi } from 'vitest'
import { rafThrottle } from './raf-throttle'

describe('rafThrottle', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('coalesces multiple calls into one animation frame', () => {
    let rafCb: FrameRequestCallback | null = null
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCb = cb
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const spy = vi.fn()
    const throttled = rafThrottle(spy)
    throttled('a')
    throttled('b')
    throttled('c')
    expect(spy).not.toHaveBeenCalled()
    // Read through a helper: TS narrows the outer `let` to `null` because the
    // only assignment happens inside the stubbed rAF callback.
    const runPendingFrame = () => rafCb?.(0)
    runPendingFrame()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith('c')
  })

  it('flush delivers the latest pending args immediately', () => {
    vi.stubGlobal('requestAnimationFrame', () => 7)
    vi.stubGlobal('cancelAnimationFrame', () => undefined)
    const spy = vi.fn()
    const throttled = rafThrottle(spy)
    throttled(1)
    throttled(2)
    throttled.flush()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(2)
  })

  it('cancel drops pending work', () => {
    vi.stubGlobal('requestAnimationFrame', () => 9)
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const spy = vi.fn()
    const throttled = rafThrottle(spy)
    throttled('x')
    throttled.cancel()
    expect(cancel).toHaveBeenCalledWith(9)
    throttled.flush()
    expect(spy).not.toHaveBeenCalled()
  })
})
