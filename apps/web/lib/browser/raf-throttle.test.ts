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
    rafCb?.(0)
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
