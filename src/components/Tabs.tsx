import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Icon, type IconName } from './Icon'

export interface TabDefinition {
  id: string
  label: string
  icon: IconName
  /** Shows the unmet-requirement dot. */
  incomplete?: boolean
  /** A count on the tab — what a CV just put there. */
  badge?: string
}

interface TabsProps {
  tabs: TabDefinition[]
  activeId: string
  onChange: (id: string) => void
  /** Distinguishes the shared layout animation if two tab rows ever coexist. */
  layoutId?: string
}

/** How much of the tab beyond the selected one to reveal, in px. */
const PEEK = 16

/**
 * A tab row whose selected tab is filled rather than underlined.
 *
 * The pill is a single element moved between tabs by Motion's shared layout
 * animation (`layoutId`), so selection travels instead of cross-fading. That
 * is the whole reason it is a Motion component and not a CSS class: CSS cannot
 * animate a background between two separate elements.
 *
 * On a phone the row scrolls, and a row that scrolls has to say so. Choosing a
 * tab brings the NEXT one in the direction you are travelling into view along
 * with it, so the edge of a further tab is always showing and the row reads as
 * a row rather than as everything there is.
 */
export function Tabs({ tabs, activeId, onChange, layoutId = 'tab-pill' }: TabsProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const chips = useRef(new Map<string, HTMLButtonElement>())
  const previous = useRef(activeId)

  useEffect(() => {
    const row = rowRef.current
    const chip = chips.current.get(activeId)
    if (!row || !chip) return

    const index = tabs.findIndex((tab) => tab.id === activeId)
    const was = tabs.findIndex((tab) => tab.id === previous.current)
    previous.current = activeId

    /*
     * Travelling forwards reveals the tab after; backwards, the one before.
     * Landing on the same tab (a first render) looks forwards, so the row
     * still shows there is more to the right of it.
     */
    const step = was > index ? -1 : 1
    const neighbour = tabs[index + step]
    const beyond = neighbour ? chips.current.get(neighbour.id) : undefined

    /*
     * Measured from live rects rather than offsetLeft/scrollLeft: those are
     * mirrored in RTL and each engine disagrees about the sign. A delta taken
     * from rects is physical, and scrollBy takes a physical delta.
     */
    const view = row.getBoundingClientRect()
    const here = chip.getBoundingClientRect()
    const there = beyond?.getBoundingClientRect()

    const start = Math.min(here.left, there?.left ?? here.left) - PEEK
    const end = Math.max(here.right, there?.right ?? here.right) + PEEK

    let delta = 0
    if (end - start > view.width) {
      /*
       * Both will not fit. The selected tab wins, and the neighbour gets
       * whatever peek is left over on its side.
       */
      delta =
        step > 0
          ? here.right + PEEK - view.right
          : here.left - PEEK - view.left
    } else if (end > view.right) {
      delta = end - view.right
    } else if (start < view.left) {
      delta = start - view.left
    }

    if (Math.abs(delta) < 1) return
    row.scrollBy({ left: delta, behavior: 'smooth' })
  }, [activeId, tabs])

  return (
    <div ref={rowRef} role="tablist" aria-label="Sections" className="md-tabs">
      {tabs.map((tab) => {
        const selected = tab.id === activeId
        return (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) chips.current.set(tab.id, element)
              else chips.current.delete(tab.id)
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            className="md-tab"
            onClick={() => onChange(tab.id)}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                className="md-tab__indicator"
                // Spatial spring: the pill overshoots a touch as it lands.
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            ) : null}
            <span className="md-tab__state" aria-hidden="true" />
            <Icon name={tab.icon} />
            <span className="md-tab__label">{tab.label}</span>
            {tab.badge ? (
              <span className="md-tab__badge">{tab.badge}</span>
            ) : null}
            {tab.incomplete && !selected && !tab.badge ? (
              <span className="md-tab__dot" aria-hidden="true" />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
