import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * A cross-dissolve between peer destinations.
 *
 * `AnimatePresence` in its default sync mode keeps the outgoing page mounted
 * while the incoming one animates in, so the two overlap. That overlap is the
 * point: `mode="wait"` fades the old page out and only then brings the new one
 * in, which leaves a moment where neither is on screen - and that gap reads as
 * a blink no matter how long you make the fade.
 *
 * The stacking is done in CSS (see components/page-transition.css) rather than
 * with absolute positioning, so the container still takes its height from the
 * content and the page below does not collapse mid-transition.
 *
 * Opacity only - nothing moves, nothing scales. `easeInOut` rather than one of
 * Material's emphasized curves, which are front-loaded by design and read as a
 * snap.
 *
 * Deliberately not the View Transitions API, unlike the theme switch: a view
 * transition swaps the live DOM for static snapshots for its whole duration,
 * which would freeze the rail's active indicator and icon fill mid-animation.
 */
export function PageTransition({
  transitionKey,
  children,
}: {
  transitionKey: string
  children: ReactNode
}) {
  return (
    <div className="page-transition">
      {/* initial={false}: no fade on first paint, only on navigation. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={transitionKey}
          className="page-transition__layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
