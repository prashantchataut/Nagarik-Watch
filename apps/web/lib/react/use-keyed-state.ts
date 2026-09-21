'use client'

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * State that falls back to a fresh default whenever `key` changes.
 *
 * This is the render-time form of "reset the state when the input changes".
 * Written as an effect — `useEffect(() => setValue(next), [key])` — it costs an
 * extra render per change and trips `react-hooks/set-state-in-effect`; written
 * as a plain `useState`, the stale value renders once before the effect lands.
 * Keeping the key next to the stored value makes the reset part of render: the
 * override only applies while its key still matches.
 *
 * `key` must be a string so comparison is by value, not identity. Build it from
 * whatever the old effect listed in its dependency array.
 */
export function useKeyedState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [stored, setStored] = useState<{ key: string; value: T } | null>(null)
  const value = stored?.key === key ? stored.value : defaultValue

  // Updater functions need the value as it stands now, which is `defaultValue`
  // until something has overridden it. Resolving that inside the state updater
  // keeps it out of render, where mutating a ref would not be allowed.
  const set = useCallback<Dispatch<SetStateAction<T>>>(
    (next) =>
      setStored((previous) => {
        const base = previous?.key === key ? previous.value : defaultValue
        return {
          key,
          value: typeof next === 'function' ? (next as (prev: T) => T)(base) : next,
        }
      }),
    [key, defaultValue],
  )

  return [value, set]
}
