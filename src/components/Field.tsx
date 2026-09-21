import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Icon } from './Icon'

interface Common {
  label: string
  help?: string
  error?: string
  className?: string
}

function wrapper(error: string | undefined, className: string | undefined) {
  return ['md-field', error ? 'md-field--error' : null, className]
    .filter(Boolean)
    .join(' ')
}

/**
 * An outlined text field. The helper line doubles as the error message — one
 * slot, so a field never grows taller when it goes invalid and shoves the rest
 * of the form down.
 */
export function TextField({
  label,
  help,
  error,
  className,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const helpId = `${id}-help`
  const message = error ?? help

  return (
    <div className={wrapper(error, className)}>
      <label className="md-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="md-field__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? helpId : undefined}
        {...rest}
      />
      {message ? (
        <p id={helpId} className="md-field__help">
          {message}
        </p>
      ) : null}
    </div>
  )
}

export function TextArea({
  label,
  help,
  error,
  className,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  const helpId = `${id}-help`
  const message = error ?? help

  return (
    <div className={wrapper(error, className)}>
      <label className="md-field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="md-field__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? helpId : undefined}
        {...rest}
      />
      {message ? (
        <p id={helpId} className="md-field__help">
          {message}
        </p>
      ) : null}
    </div>
  )
}

/**
 * A native <select> behind M3's outline. Native is deliberate: it gets the
 * platform's own picker on touch, keyboard type-ahead and screen-reader
 * support for free, none of which a div-based menu has without real work.
 */
export function SelectField({
  label,
  help,
  error,
  className,
  children,
  ...rest
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId()
  const helpId = `${id}-help`
  const message = error ?? help

  return (
    <div className={wrapper(error, className)}>
      <label className="md-field__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="md-field__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? helpId : undefined}
        {...rest}
      >
        {children}
      </select>
      <span className="md-field__trailing" aria-hidden="true">
        <Icon name="expand_more" size={20} />
      </span>
      {message ? (
        <p id={helpId} className="md-field__help">
          {message}
        </p>
      ) : null}
    </div>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SegmentedButton<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="md-segmented">
      {options.map((option) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            className="md-segmented__option"
            onClick={() => onChange(option.value)}
          >
            {checked ? <Icon name="check" /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="md-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="md-switch__handle">
        {checked ? <Icon name="check" /> : null}
      </span>
    </button>
  )
}
