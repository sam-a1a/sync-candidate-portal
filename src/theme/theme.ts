/**
 * Theme vocabulary and the pure logic for resolving a preference into the
 * attributes the stylesheet keys off.
 *
 * Kept free of React so the same resolution can run in the pre-paint inline
 * script in index.html, which has no framework available.
 */

/** What the user picked. `system` defers to the OS. */
export type ThemeMode = 'light' | 'dark' | 'system'
export type ContrastPreference = 'standard' | 'medium' | 'high' | 'system'

/** What actually lands on <html>. `system` has been resolved away. */
export type ResolvedTheme = 'light' | 'dark'
export type ResolvedContrast = 'standard' | 'medium' | 'high'

/** The two languages this app ships. Direction follows from the language. */
export type Language = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'

export const STORAGE_KEYS = {
  mode: 'md-theme-mode',
  contrast: 'md-theme-contrast',
  language: 'md-theme-language',
} as const

export const MEDIA = {
  dark: '(prefers-color-scheme: dark)',
  /**
   * `prefers-contrast: more` is the only increase the OS reports - there is no
   * signal for M3's intermediate level. So system contrast resolves to either
   * `standard` or `high`; `medium` is reachable only as an explicit choice.
   */
  moreContrast: '(prefers-contrast: more)',
} as const

export const LANGUAGE_DIRECTION: Record<Language, Direction> = {
  en: 'ltr',
  ar: 'rtl',
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'system') return mode
  return matchMedia(MEDIA.dark).matches ? 'dark' : 'light'
}

export function resolveContrast(
  preference: ContrastPreference,
): ResolvedContrast {
  if (preference !== 'system') return preference
  return matchMedia(MEDIA.moreContrast).matches ? 'high' : 'standard'
}

interface ViewTransition {
  ready: Promise<void>
  finished: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition
}

/**
 * Switches the theme as a smooth cross-fade instead of an instant repaint.
 *
 * Every surface changing colour on the same frame is what makes a theme switch
 * feel like a flash. A View Transition snapshots the old scheme, lets the new
 * one paint, and fades between them, so the same repaint becomes one gradual
 * change. The timing is set in components/theme-transition.css.
 *
 * `apply` must commit synchronously - wrap React state updates in `flushSync`
 * - because startViewTransition snapshots the DOM the moment the callback
 * returns. An async update would be captured before it landed and nothing
 * would appear to change.
 *
 * Falls back to applying immediately where View Transitions are unavailable,
 * or where the user asked for reduced motion.
 */
export function transitionTheme(apply: () => void): void {
  const doc = document as DocumentWithViewTransition
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!doc.startViewTransition || reduceMotion) {
    apply()
    return
  }

  doc.startViewTransition(apply)
}

/**
 * Writes the resolved scheme onto <html>.
 *
 * Both attributes are always written together: the selectors in
 * tokens/color.css match on the pair, so setting only one would fall through
 * to the light/standard default.
 */
export function applyTheme(options: {
  theme: ResolvedTheme
  contrast: ResolvedContrast
  language: Language
}): void {
  const root = document.documentElement
  root.dataset.theme = options.theme
  root.dataset.contrast = options.contrast
  root.lang = options.language
  root.dir = LANGUAGE_DIRECTION[options.language]

  // Keep the mobile browser chrome in step with the page surface.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    const surface = getComputedStyle(root)
      .getPropertyValue('--md-sys-color-surface')
      .trim()
    if (surface) meta.setAttribute('content', surface)
  }
}
