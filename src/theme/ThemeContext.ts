import { createContext } from 'react'
import type {
  ContrastPreference,
  Direction,
  Language,
  ResolvedContrast,
  ResolvedTheme,
  ThemeMode,
} from './theme'

export interface ThemeContextValue {
  /** The stored preference, which may be `system`. */
  mode: ThemeMode
  contrast: ContrastPreference
  language: Language

  /** What is actually on <html> right now, with `system` resolved. */
  resolvedTheme: ResolvedTheme
  resolvedContrast: ResolvedContrast
  direction: Direction

  setMode: (mode: ThemeMode) => void
  setContrast: (contrast: ContrastPreference) => void
  setLanguage: (language: Language) => void
}

/**
 * Lives apart from ThemeProvider so that file can export only a component,
 * which is what react-refresh needs to hot-reload it cleanly.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
