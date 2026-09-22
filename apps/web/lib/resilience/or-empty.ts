/**
 * `orEmpty(promise)` — degrade a failed list read to an empty list without
 * losing its element type.
 *
 * The codebase leans on `await something().catch(() => [])` so a flaky ops
 * query never takes a page down. That idiom is correct at runtime and wrong at
 * the type level: the catch handler infers `never[]`, so the result widens to
 * `T[] | never[]`. TypeScript cannot resolve `.map()` / `new Map()` over that
 * union and silently degrades the callback parameter to `{}`, which is how the
 * ads, live-widgets and province-heat modules ended up with `Property 'active'
 * does not exist on type '{}'` errors that `ignoreBuildErrors` was hiding.
 *
 * Runtime behaviour is identical to the inline catch; only the inferred type
 * changes, from `T[] | never[]` to `T[]`.
 */
export function orEmpty<T>(promise: Promise<readonly T[]>): Promise<T[]> {
  return promise.then(
    (value) => value as T[],
    () => [],
  )
}
