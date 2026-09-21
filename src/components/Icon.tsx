import type { CSSProperties } from 'react'
import { ICONS, type IconName } from './icons.generated'

export type { IconName }

interface IconProps {
  name: IconName
  /**
   * Size in px. Also drives the `opsz` axis, since Material Symbols are drawn
   * with different stroke weights per optical size.
   */
  size?: number
  /** Mirror in RTL. Only for icons that genuinely point somewhere. */
  directional?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * A Material Symbol.
 *
 * Rendered as text from a subsetted variable icon font, so `FILL`, `wght` and
 * `GRAD` are animatable axes rather than separate assets. Set `--md-icon-fill`
 * on this element or any ancestor to fill it; see the nav rail for a selected
 * state that animates the axis instead of swapping icons.
 *
 * Always `aria-hidden`: an icon font glyph is a Private Use Area codepoint,
 * which a screen reader cannot pronounce. Label the interactive element that
 * contains it instead.
 */
export function Icon({
  name,
  size,
  directional = false,
  className,
  style,
}: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        'md-icon',
        directional ? 'md-icon--directional' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        size === undefined
          ? style
          : ({
              ...style,
              '--md-icon-size': `${size}px`,
              // Bare number: an opsz axis value is a <number>, not a length.
              '--md-icon-opsz': size,
            } as CSSProperties)
      }
    >
      {ICONS[name]}
    </span>
  )
}
