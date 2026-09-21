import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { IconButton } from './Button'
import { useT } from '../i18n/useT'

export interface SearchOption {
  id: string
  label: string
  /** Matched in addition to the label — a dialling code, a language's own name. */
  keywords?: string
  /** Rendered before the label: a flag, a brand mark. */
  leading?: ReactNode
  /** Rendered after the label, muted: a dialling code, a country. */
  trailing?: string
  /** Already chosen — shown ticked and not selectable again. */
  taken?: boolean
}

/**
 * A dialog for picking one item from a long list, with search.
 *
 * Filtering is synchronous and unthrottled on purpose. These lists are
 * hundreds of items, not thousands: the filter is a substring test over an
 * array we already hold, so it finishes inside a frame. A debounce would only
 * add latency between the keystroke and the result — the thing that actually
 * makes a search box feel slow.
 *
 * The results deliberately do NOT animate. Rows that slide as the list narrows
 * fight the reading, and the panel is a fixed height so it cannot resize under
 * the cursor either. Typing should reveal the answer, not play a transition.
 */
export function SearchDialog({
  open,
  onClose,
  onPick,
  title,
  placeholder,
  options,
  emptyMessage,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onPick: (option: SearchOption) => void
  title: string
  placeholder: string
  options: SearchOption[]
  emptyMessage?: string
  /**
   * Adds whatever was typed, when the list has no match. Without it a list
   * can only offer what it already knows, which is wrong for a set the user is
   * allowed to extend.
   */
  onCreate?: (value: string) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const t = useT()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      setQuery('')
      // Focus after the open transition starts, so the dialog is in the top
      // layer before the caret lands in it.
      requestAnimationFrame(() => input.current?.focus())
    }
  }, [open])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        option.keywords?.toLowerCase().includes(needle),
    )
  }, [options, query])

  /*
   * Offer to add the typed value only when it is not already in the list —
   * otherwise picking an existing entry and creating a duplicate of it would
   * sit side by side.
   */
  const typed = query.trim()
  const canCreate =
    Boolean(onCreate) &&
    typed.length > 0 &&
    !options.some((option) => option.label.toLowerCase() === typed.toLowerCase())

  return (
    <dialog
      ref={ref}
      className="md-dialog md-search"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {open ? (
          <motion.div
            className="md-dialog__panel md-search__panel"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="md-search__head">
              <h2 className="md-dialog__headline">{title}</h2>
              <IconButton
                icon="close"
                label={t('common.close')}
                onClick={onClose}
              />
            </div>

            <div className="md-search__field">
              <Icon name="search" size={20} />
              <input
                ref={input}
                type="search"
                value={query}
                placeholder={placeholder}
                aria-label={placeholder}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <IconButton
                  icon="close"
                  label={t('common.clearSearch')}
                  onClick={() => {
                    setQuery('')
                    input.current?.focus()
                  }}
                />
              ) : null}
            </div>

            <ul className="md-search__results">
              {results.length === 0 && !canCreate ? (
                <li className="md-search__empty">{emptyMessage ?? t('common.nothingMatches')}</li>
              ) : null}

              {canCreate ? (
                <li>
                  <button
                    type="button"
                    className="md-search__create"
                    onClick={() => {
                      onCreate?.(query.trim())
                      onClose()
                    }}
                  >
                    <span className="md-search__leading">
                      <Icon name="add" size={20} />
                    </span>
                    <span className="md-search__label">
                      {t('common.addQuery', { query: query.trim() })}
                    </span>
                  </button>
                </li>
              ) : null}
              {results.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    disabled={option.taken}
                    onClick={() => {
                      onPick(option)
                      onClose()
                    }}
                  >
                    {option.leading ? (
                      <span className="md-search__leading">{option.leading}</span>
                    ) : null}
                    <span className="md-search__label">{option.label}</span>
                    {option.trailing ? (
                      <span className="md-search__trailing">
                        {option.trailing}
                      </span>
                    ) : null}
                    {option.taken ? (
                      <span className="md-search__taken">
                        <Icon name="check" size={18} />
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  )
}
