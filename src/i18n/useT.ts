import { useMemo } from 'react'
import { useTheme } from '../theme/useTheme'
import { AR, EN, type StringKey } from './strings'

type Vars = Record<string, string | number>

/**
 * A piece of CONTENT in both languages — a job title, an employer's name, a
 * line of a description. Chrome lives in the dictionary; content travels with
 * the record it belongs to, because that is where the API would carry it.
 */
export interface L {
  en: string
  ar: string
}

function format(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  )
}

export interface Translate {
  (key: StringKey, vars?: Vars): string
  /**
   * A count that changes the noun. English breaks at one, Arabic breaks in
   * more places than a UI can usefully carry, so the Arabic `.other` form is
   * written to read correctly for every count above one.
   */
  count: (base: string, count: number, vars?: Vars) => string
  /** One bilingual value, in the language being read. */
  say: (value: L) => string
  /** The language itself, for Intl. */
  locale: 'en' | 'ar'
}

/**
 * The app's strings, in the language the rail is set to.
 *
 * The language lives on the theme provider — it is the same preference that
 * writes `lang` and `dir` onto <html> — so a component that translates does
 * not need a second context.
 */
export function useT(): Translate {
  const { language } = useTheme()

  return useMemo(() => {
    const table = language === 'ar' ? AR : EN

    const translate = (key: StringKey, vars?: Vars) => format(table[key], vars)

    const count = (base: string, n: number, vars?: Vars) => {
      const key = `${base}.${n === 1 ? 'one' : 'other'}` as StringKey
      return format(table[key], { count: n, ...vars })
    }

    const say = (value: L) => value[language]

    return Object.assign(translate, { count, say, locale: language })
  }, [language])
}
