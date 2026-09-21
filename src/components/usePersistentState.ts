import { useCallback, useState } from 'react'

/**
 * State that survives a reload, kept in localStorage.
 *
 * Used for the things a person opened and would expect to find open again —
 * which entry of a list is expanded, whether the checklist is showing. Nothing
 * here is data; it is only where they had got to, so a read that fails (a
 * private window, storage disabled) falls back to the default rather than
 * throwing, and a write that fails is simply lost.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored === null ? initial : (JSON.parse(stored) as T)
    } catch {
      return initial
    }
  })

  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === 'function'
            ? (next as (current: T) => T)(current)
            : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          /* Storage is unavailable; the session keeps it, the next one does not. */
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set]
}
