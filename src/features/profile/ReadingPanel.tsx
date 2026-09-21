import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Button, IconButton } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { CV_DRAFTS, READ_SECTIONS } from './data'
import { useT } from '../../i18n/useT'

const SMOOTH = { duration: 0.32, ease: [0.4, 0, 0.2, 1] } as const

export interface Reading {
  id: string
  name: string
  /** Section ids the reader has landed, in the order they arrived. */
  found: string[]
  done: boolean
}

/**
 * Draft B: the read happens over the page.
 *
 * The steps are the API's own — uploaded, being read, read in full — and under
 * them is the thing the app never showed: what is coming out of the file, a
 * line at a time, with what it actually says rather than a tick.
 *
 * Closing it does not stop the read. The CV's row in the list carries the same
 * states, and the question comes up there instead when it lands.
 */
export function ReadingPanel({
  reading,
  onClose,
  onUpdate,
}: {
  reading: Reading | null
  onClose: () => void
  onUpdate: () => void
}) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const open = reading !== null

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (open && !element.open) element.showModal()
  }, [open])

  const draft = CV_DRAFTS.c1
  const found = reading?.found ?? []
  const done = reading?.done ?? false

  /* Uploaded is behind us the moment this opens; the rest follows the read. */
  const step = done ? 2 : found.length > 0 ? 1 : 0

  return (
    <dialog
      ref={ref}
      className="md-dialog"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <AnimatePresence onExitComplete={() => ref.current?.close()}>
        {reading ? (
          <motion.div
            className="md-dialog__panel reading"
            aria-label={`${t('reading.reading')} ${reading.name}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={SMOOTH}
          >
            <header className="reading__head">
              <span className="reading__mark" aria-hidden="true">
                <Icon name="description" size={24} />
              </span>
              <div>
                <h2>
                  {done ? t('reading.readInFull') : t('reading.reading')}{' '}
                  {reading.name}
                </h2>
                <p>{t('reading.nothingChanges')}</p>
              </div>
              <IconButton
                icon="close"
                label={t('common.close')}
                onClick={onClose}
              />
            </header>

            <ol className="reading__steps">
              {(
                [
                  t('reading.uploaded'),
                  t('reading.readingIt'),
                  t('reading.read'),
                ] as const
              ).map((label, index) => (
                <li
                  key={label}
                  className={
                    index < step
                      ? 'is-done'
                      : index === step
                        ? 'is-now'
                        : undefined
                  }
                >
                  <span className="reading__tick" aria-hidden="true">
                    {index < step ? <Icon name="check" size={14} /> : null}
                  </span>
                  {label}
                </li>
              ))}
            </ol>

            {/* The bar is the count of sections landed, not a guess at time. */}
            <div
              className="reading__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={READ_SECTIONS.length}
              aria-valuenow={found.length}
              aria-label={t('reading.progress', {
                found: found.length,
                total: READ_SECTIONS.length,
              })}
            >
              <motion.span
                animate={{ width: `${(found.length / READ_SECTIONS.length) * 100}%` }}
                transition={SMOOTH}
              />
            </div>

            <p className="reading__label">
              {done
                ? t('reading.foundCount', {
                    found: found.length,
                    total: READ_SECTIONS.length,
                  })
                : t('reading.soFar')}
            </p>

            <ul className="reading__found">
              {READ_SECTIONS.map((section, index) => {
                const landed = found.includes(section.id)
                const next = !done && index === found.length
                return (
                  <li
                    key={section.id}
                    className={landed ? 'is-found' : next ? 'is-next' : undefined}
                  >
                    <span className="reading__tick" aria-hidden="true">
                      {landed ? <Icon name="check" size={14} /> : null}
                    </span>
                    <span>
                      <span className="reading__found-label">
                        <Icon name={section.icon} size={16} />
                        {t(section.label)}
                      </span>
                      {/*
                        The detail arrives with the section, so the line is
                        empty until it lands rather than promising something.
                      */}
                      <AnimatePresence initial={false}>
                        {landed ? (
                          <motion.span
                            className="reading__found-detail"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={SMOOTH}
                          >
                            {section.detail(draft, t)}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </span>
                  </li>
                )
              })}
            </ul>

            {/*
              The question the repo asks in a dialog of its own, asked here
              instead — you have just watched the answer being assembled.
            */}
            <AnimatePresence initial={false}>
              {done ? (
                <motion.div
                  className="reading__actions"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SMOOTH}
                >
                  <p>{t('reading.question')}</p>
                  <div>
                    <Button variant="text" onClick={onClose}>
                      {t('profile.keepWhatIHave')}
                    </Button>
                    <Button variant="filled" onClick={onUpdate}>
                      {t('reading.updateFrom')}
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  )
}
