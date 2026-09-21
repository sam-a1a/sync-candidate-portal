import { AnimatePresence, motion } from 'motion/react'
import type { ElementType, ReactNode, Ref } from 'react'

/**
 * A list whose items animate in and out, and whose remaining items move to
 * close the gap rather than jumping.
 *
 * `mode="popLayout"` is the part that matters. In the default mode an exiting
 * item keeps its space until its animation ends, so everything below sits
 * still and then snaps up — the jump people notice. popLayout takes the
 * exiting item out of layout immediately and lets `layout` animate the
 * survivors into their new positions, so removing something looks like the
 * list closing over it.
 *
 * Two things this gets wrong easily, both learned the hard way:
 *
 * 1. popLayout measures the exiting child through a ref. A wrapper component
 *    that does not FORWARD that ref silently does nothing — the item vanishes
 *    and the rest snap. Hence `ref` on AnimatedItem.
 *
 * 2. The empty state has to live inside the same AnimatePresence. If the list
 *    is swapped for an "add something" message once it is empty, removing the
 *    LAST item unmounts the whole list, AnimatePresence goes with it, and that
 *    one removal plays no animation at all.
 */

const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const

export function AnimatedList({
  as: Tag = 'div',
  className,
  children,
  ...rest
}: {
  as?: ElementType
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  return (
    <Tag className={className} {...rest}>
      <AnimatePresence initial={false} mode="popLayout">
        {children}
      </AnimatePresence>
    </Tag>
  )
}

export function AnimatedItem({
  as = 'div',
  className,
  children,
  ref,
}: {
  as?: 'div' | 'li'
  className?: string
  children: ReactNode
  /** Forwarded to the motion element — popLayout needs it. */
  ref?: Ref<HTMLElement>
}) {
  const Tag = as === 'li' ? motion.li : motion.div
  return (
    <Tag
      ref={ref as never}
      layout
      className={className}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={TRANSITION}
    >
      {children}
    </Tag>
  )
}
