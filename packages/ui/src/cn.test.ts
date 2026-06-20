import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional and object syntax (clsx)', () => {
    expect(cn('base', { active: true, hidden: false }, ['x', 'y'])).toBe('base active x y')
  })

  it('lets later Tailwind classes override earlier conflicting ones (twMerge)', () => {
    // p-1 vs p-4: the later one wins.
    expect(cn('p-1', 'p-4')).toBe('p-4')
    // text-center vs text-left: later wins.
    expect(cn('text-center', 'text-left')).toBe('text-left')
  })

  it('ignores falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '')).toBe('a')
  })
})
