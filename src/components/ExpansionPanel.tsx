import { AnimatePresence, motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ExpansionPanelProps {
  title: string
  supporting?: string
  /** A short status chip in the header, e.g. "Current". */
  chip?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

/**
 * An M3 expansion panel.
 *
 * This is what takes the scrolling out of the profile: three jobs are three
 * header rows until you open one, instead of three full forms stacked.
 *
 * Height is animated from `auto`, which Motion can do because it measures the
 * content — a plain CSS transition cannot, since `height: auto` is not an
 * interpolable value. `overflow: hidden` during the transition stops the body
 * spilling out of the collapsing box.
 */
export function ExpansionPanel({
  title,
  supporting,
  chip,
  open,
  onToggle,
  children,
}: ExpansionPanelProps) {
  const bodyId = useId()

  return (
    <div className={`md-panel${open ? ' md-panel--open' : ''}`}>
      <button
        type="button"
        className="md-panel__header"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <span className="md-panel__state" aria-hidden="true" />
        <span className="md-panel__text">
          <span className="md-panel__title">{title}</span>
          {supporting ? (
            <span className="md-panel__supporting">{supporting}</span>
          ) : null}
        </span>
        {chip ? <span className="md-panel__chip">{chip}</span> : null}
        <span className="md-panel__chevron" aria-hidden="true">
          <Icon name={open ? 'expand_less' : 'expand_more'} size={22} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={bodyId}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
              // Opacity trails the height slightly so text does not appear
              // before there is room for it.
              opacity: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="md-panel__body">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
