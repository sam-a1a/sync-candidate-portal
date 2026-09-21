import { motion } from 'motion/react'
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

/**
 * A tab row whose selected tab is filled rather than underlined.
 *
 * The pill is a single element moved between tabs by Motion's shared layout
 * animation (`layoutId`), so selection travels instead of cross-fading. That
 * is the whole reason it is a Motion component and not a CSS class: CSS cannot
 * animate a background between two separate elements.
 */
export function Tabs({ tabs, activeId, onChange, layoutId = 'tab-pill' }: TabsProps) {
  return (
    <div role="tablist" aria-label="Sections" className="md-tabs">
      {tabs.map((tab) => {
        const selected = tab.id === activeId
        return (
          <button
            key={tab.id}
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
