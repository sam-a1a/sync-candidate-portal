import type { Translate } from './useT'

/**
 * A moment, as the API's `relativeTime()` would phrase it.
 *
 * Held as a number and a unit rather than an English sentence, because "2 days
 * ago" cannot be translated after the fact — Arabic breaks plurals in places
 * English does not, and the seed is what the server would send.
 */
export type Relative =
  | { unit: 'now' }
  | { unit: 'yesterday' }
  | { unit: 'hour' | 'day' | 'week' | 'month'; value: number }

export function relativeTime(when: Relative, t: Translate): string {
  if (when.unit === 'now') return t('time.justNow')
  if (when.unit === 'yesterday') return t('time.yesterday')
  return t.count(`time.${when.unit}`, when.value)
}

/** An absolute date, in the language the page is read in. */
export function absoluteDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}
