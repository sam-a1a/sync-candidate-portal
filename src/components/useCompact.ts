import { useSyncExternalStore } from 'react'

/**
 * M3's compact window size class: anything under 600px.
 *
 * https://m3.material.io/foundations/layout/applying-layout/window-size-classes
 *
 * A rail and a bottom bar are two different components in M3, not one
 * component with two skins — their anatomy, their order in the DOM and what
 * they can hold all differ. So this returns a boolean and the shell picks,
 * rather than CSS trying to reflow one into the other.
 *
 * useSyncExternalStore rather than an effect: the first render already knows
 * the answer, so the rail never paints for a frame before the bar replaces it.
 */
const QUERY = '(max-width: 599px)'

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia(QUERY)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

export function useCompact(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
