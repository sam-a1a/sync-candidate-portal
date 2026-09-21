import { flushSync } from 'react-dom'
import { useTheme } from '../theme/useTheme'
import { transitionTheme, type Language } from '../theme/theme'

/** The two languages the app ships, and the flag each one wears. */
export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'en-us' },
  { code: 'ar', label: 'العربية', flag: 'ar' },
]

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * The theme and language switches, shared by the rail and the compact bar.
 *
 * Both wear the same rule: the control shows the thing it will switch TO, and
 * both ride the same view transition, because switching either one repaints
 * every surface at once.
 */
export function useNavControls() {
  const { resolvedTheme, setMode, language, setLanguage } = useTheme()

  /*
   * A plain two-state switch. The provider still resolves `system` for a first
   * visit, so the app opens in whatever the OS prefers - but once someone has
   * an opinion, "follow the system" is not a third thing they want to click
   * past to get back to light.
   */
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  const switchTheme = () => {
    // flushSync: the view transition snapshots the DOM as soon as this
    // returns, so the attribute has to be on <html> by then.
    transitionTheme(() => flushSync(() => setMode(nextTheme)))
  }

  const nextLanguage =
    LANGUAGES.find((entry) => entry.code !== language) ?? LANGUAGES[0]

  const switchLanguage = () => {
    transitionTheme(() => flushSync(() => setLanguage(nextLanguage.code)))
  }

  return { nextTheme, switchTheme, nextLanguage, switchLanguage }
}
