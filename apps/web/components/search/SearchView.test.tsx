// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SearchableStory } from '@/lib/search'
import {
  cleanupRendered,
  click,
  flush,
  flushAsync,
  getButton,
  queryByText,
  renderClient,
  typeInto,
} from '@/test/render'

/**
 * The most stateful component in the app: a debounce, a URL mirror, an aborted
 * archive fetch, keyboard selection and sessionStorage recents all share one
 * input. These tests drive it through the timers rather than reaching into
 * state, so a refactor that keeps the behaviour keeps the tests.
 */

const replace = vi.fn()
const push = vi.fn()
let params = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push, prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => params,
}))

// `next/image` wants the Next build pipeline for `fill`; the thumbnail is
// decorative here and the results assertions never look at it.
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <span data-testid="image" data-src={props.src} />,
}))

const { SearchView } = await import('@/components/search/SearchView')

function story(partial: Partial<SearchableStory>): SearchableStory {
  return {
    id: partial.id ?? '1',
    slug: partial.slug ?? 'slug',
    category: partial.category ?? {
      id: 'c',
      slug: 'politics',
      nameNe: 'राजनीति',
      nameEn: 'Politics',
    },
    categoryLabel: partial.categoryLabel ?? 'राजनीति',
    titleNe: partial.titleNe ?? '',
    titleEn: partial.titleEn,
    deckNe: partial.deckNe,
    deckEn: partial.deckEn,
    byline: partial.byline ?? '',
    publishedAt: partial.publishedAt ?? '2026-06-01T00:00:00Z',
    hasEnglish: partial.hasEnglish ?? false,
    isBreaking: partial.isBreaking ?? false,
    authors: partial.authors ?? [{ name: 'श्रीजना कार्की', slug: 'srijana-karki' }],
    heroImage: null,
  }
}

const corpus: SearchableStory[] = [
  story({
    id: '1',
    slug: 'budget',
    titleNe: 'बजेटमा पूर्वाधारको प्राथमिकता',
    titleEn: 'Budget puts infrastructure first',
  }),
  story({ id: '2', slug: 'monsoon', titleNe: 'मनसुन सुरु', titleEn: 'Monsoon arrives early' }),
  story({
    id: '3',
    slug: 'budget-districts',
    titleNe: 'जिल्लामा बजेट समीक्षा',
    titleEn: 'Budget review for the districts',
  }),
]

function input(container: HTMLElement) {
  return container.querySelector('input[type="search"]') as HTMLInputElement
}

function resultTitles(container: HTMLElement) {
  return [...container.querySelectorAll('[role="option"]')].map((node) =>
    (node.textContent ?? '').replace(/\s+/g, ' ').trim(),
  )
}

function key(node: HTMLElement, name: string) {
  flush(() => {
    node.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }))
  })
}

/** Move past the 300ms debounce, then let the archive fetch settle. */
async function settle() {
  flush(() => {
    vi.advanceTimersByTime(400)
  })
  await flushAsync()
}

describe('SearchView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    params = new URLSearchParams()
    replace.mockClear()
    push.mockClear()
    window.sessionStorage.clear()
    window.localStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ items: [] }), { status: 200 })),
    )
  })

  afterEach(() => {
    cleanupRendered()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('ranks the corpus only after the debounce has elapsed', async () => {
    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'monsoon')

    expect(resultTitles(container)).toHaveLength(0)
    await settle()

    expect(resultTitles(container)[0]).toContain('Monsoon arrives early')
    expect(replace).toHaveBeenCalledWith('/en/search?q=monsoon', { scroll: false })
  })

  it('opens the highlighted result on Enter, and moves the highlight with the arrows', async () => {
    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'budget')
    await settle()

    const options = [...container.querySelectorAll('[role="option"]')]
    expect(options.length).toBeGreaterThan(1)
    expect(options[0].getAttribute('aria-selected')).toBe('true')

    key(input(container), 'ArrowDown')
    expect(
      [...container.querySelectorAll('[role="option"]')][1].getAttribute('aria-selected'),
    ).toBe('true')

    key(input(container), 'Enter')
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toMatch(/^\/en\/politics\//)
  })

  it('wraps the highlight around both ends of the list', async () => {
    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'budget')
    await settle()
    const count = container.querySelectorAll('[role="option"]').length

    for (let i = 0; i < count; i += 1) key(input(container), 'ArrowDown')
    expect(
      [...container.querySelectorAll('[role="option"]')][0].getAttribute('aria-selected'),
    ).toBe('true')

    key(input(container), 'ArrowUp')
    expect(
      [...container.querySelectorAll('[role="option"]')][count - 1].getAttribute('aria-selected'),
    ).toBe('true')
  })

  it('clears the query on Escape and drops q from the URL', async () => {
    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'monsoon')
    await settle()
    replace.mockClear()

    key(input(container), 'Escape')
    expect(input(container).value).toBe('')
    await settle()

    expect(resultTitles(container)).toHaveLength(0)
    expect(replace).toHaveBeenCalledWith('/en/search', { scroll: false })
  })

  it('remembers a search and replays it when the chip is pressed', async () => {
    const first = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(first.container), 'monsoon')
    await settle()
    expect(JSON.parse(window.sessionStorage.getItem('nw-recent-searches') ?? '[]')).toEqual([
      'monsoon',
    ])
    first.unmount()

    const second = renderClient(<SearchView locale="en" corpus={corpus} />)
    click(getButton(second.container, /monsoon/))
    expect(input(second.container).value).toBe('monsoon')
  })

  it('shows the no-results state rather than an empty page', async () => {
    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'zzzzqqqq')
    await settle()

    expect(resultTitles(container)).toHaveLength(0)
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    expect(queryByText(container, /Latest news/)).not.toBeNull()
  })

  it('merges archive hits the client corpus does not hold', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).startsWith('/api/search')) {
          return new Response(
            JSON.stringify({
              items: [story({ id: '9', slug: 'archive-flood', titleEn: 'Flood archive report' })],
            }),
            { status: 200 },
          )
        }
        return new Response('{}', { status: 200 })
      }),
    )

    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'flood')
    await settle()

    expect(resultTitles(container).join(' ')).toContain('Flood archive report')
  })

  it('keeps the recent results and says so when the archive call fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    )

    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)
    typeInto(input(container), 'monsoon')
    await settle()

    expect(resultTitles(container)[0]).toContain('Monsoon arrives early')
    expect(queryByText(container, /archive search is temporarily unavailable/)).not.toBeNull()
  })

  it('starts from ?q= on a shared link', async () => {
    params = new URLSearchParams('q=monsoon')
    const { container } = renderClient(<SearchView locale="en" corpus={corpus} />)

    expect(input(container).value).toBe('monsoon')
    expect(resultTitles(container)[0]).toContain('Monsoon arrives early')
    // Drain the debounce the shared link schedules, so the archive fetch it
    // fires resolves inside the test rather than after it.
    await settle()
  })
})
