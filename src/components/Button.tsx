import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  small?: boolean
  icon?: IconName
  children?: ReactNode
}

/**
 * An M3 button. Its icon fills on hover and focus, and its corners morph from
 * full to large on press — Expressive uses shape as the press feedback rather
 * than moving or scaling the control.
 */
export function Button({
  variant = 'text',
  small = false,
  icon,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'md-button',
        `md-button--${variant}`,
        small ? 'md-button--small' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Required: an icon glyph has no accessible name of its own. */
  label: string
  danger?: boolean
}

export function IconButton({
  icon,
  label,
  danger = false,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={[
        'md-icon-button',
        danger ? 'md-icon-button--danger' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name={icon} />
    </button>
  )
}
