import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

/**
 * A component-render harness, in about eighty lines.
 *
 * The obvious move is `@testing-library/react`. It was deliberately not added:
 * everything these tests need is `createRoot` plus React 19's own `act`, and
 * the queries below are the four that the components in this repo actually
 * want (visible text, a button by its label, a form control by its accessible
 * name). A dependency that exists to save ~80 lines is not worth the lockfile.
 *
 * Every file that uses this must opt into a DOM:
 *
 *     // @vitest-environment happy-dom
 *
 * because `vitest.config.ts` runs in `node` by default — the lib/ tests are
 * the overwhelming majority and they should not pay for a DOM.
 */

declare global {
  /** React reads this off `globalThis` to decide whether `act` is expected. */
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

export type Rendered = {
  container: HTMLElement
  rerender: (next: ReactElement) => void
  unmount: () => void
}

const mounted = new Set<{ root: Root; container: HTMLElement }>()

export function renderClient(ui: ReactElement): Rendered {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const entry = { root, container }
  mounted.add(entry)

  act(() => {
    root.render(ui)
  })

  return {
    container,
    rerender(next) {
      act(() => {
        root.render(next)
      })
    },
    unmount() {
      act(() => {
        root.unmount()
      })
      container.remove()
      mounted.delete(entry)
    },
  }
}

/** Tear down anything still mounted. Call from `afterEach`. */
export function cleanupRendered(): void {
  for (const entry of [...mounted]) {
    act(() => {
      entry.root.unmount()
    })
    entry.container.remove()
    mounted.delete(entry)
  }
}

/** Flush React work queued by something other than a click — a timer, an event. */
export function flush(fn: () => void = () => {}): void {
  act(() => {
    fn()
  })
}

function textOf(node: Element): string {
  return (node.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** The deepest elements whose collapsed text matches. */
export function allByText(root: ParentNode, text: string | RegExp): HTMLElement[] {
  const matches = (value: string) => (typeof text === 'string' ? value === text : text.test(value))
  return [...root.querySelectorAll<HTMLElement>('*')].filter(
    (node) =>
      matches(textOf(node)) &&
      ![...node.children].some((child) => matches(textOf(child as Element))),
  )
}

export function queryByText(root: ParentNode, text: string | RegExp): HTMLElement | null {
  return allByText(root, text)[0] ?? null
}

export function getByText(root: ParentNode, text: string | RegExp): HTMLElement {
  const found = queryByText(root, text)
  if (!found) throw new Error(`No element with text ${String(text)}`)
  return found
}

/** A `<button>` (or `[role=button]`) by its label or `aria-label`. */
export function queryButton(root: ParentNode, label: string | RegExp): HTMLElement | null {
  const matches = (value: string) =>
    typeof label === 'string' ? value === label : label.test(value)
  return (
    [...root.querySelectorAll<HTMLElement>('button, [role="button"]')].find(
      (node) => matches(textOf(node)) || matches(node.getAttribute('aria-label') ?? ''),
    ) ?? null
  )
}

export function getButton(root: ParentNode, label: string | RegExp): HTMLElement {
  const found = queryButton(root, label)
  if (!found) throw new Error(`No button labelled ${String(label)}`)
  return found
}

/** A form control by the text of the `<label>` wrapping or pointing at it. */
export function getControl(root: ParentNode, label: string | RegExp): HTMLInputElement {
  const matches = (value: string) =>
    typeof label === 'string' ? value === label : label.test(value)
  for (const element of root.querySelectorAll<HTMLLabelElement>('label')) {
    if (!matches(textOf(element))) continue
    const inner = element.querySelector<HTMLInputElement>('input, select, textarea')
    if (inner) return inner
    const forId = element.getAttribute('for')
    if (forId) {
      const target = root.querySelector<HTMLInputElement>(`#${CSS.escape(forId)}`)
      if (target) return target
    }
  }
  throw new Error(`No form control labelled ${String(label)}`)
}

export function click(node: Element | null): void {
  if (!node) throw new Error('click() got null')
  act(() => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  })
}

/** Flush React work plus any promises it is waiting on. */
export async function flushAsync(fn: () => void | Promise<void> = () => {}): Promise<void> {
  await act(async () => {
    await fn()
  })
}

/** Type into a text input the way React wants: set the value, then fire input. */
export function typeInto(node: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const prototype = node instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement
  const setter = Object.getOwnPropertyDescriptor(prototype.prototype, 'value')?.set
  act(() => {
    setter?.call(node, value)
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

export function submit(form: HTMLFormElement): void {
  act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}
