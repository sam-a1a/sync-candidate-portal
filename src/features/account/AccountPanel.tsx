import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { Button, IconButton } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Icon, type IconName } from '../../components/Icon'
import { PICTURE_FORMATS, initials, type Account } from './data'
import { useT, type Translate } from '../../i18n/useT'

const SMOOTH = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const

/**
 * Draft B: the account is a panel over whatever you were doing, not a page.
 *
 * It holds everything the account circle points at in Sync — who you are, the
 * email you sign in with, the password, signing out, and deleting the account
 * — plus the picture, which the API already carries as `avatar_url` and which
 * had nowhere to be set.
 *
 * On the native <dialog>, like every other modal here: the top layer, the
 * inert background, focus trapping and Escape come free.
 */
export function AccountPanel({
  open,
  account,
  name,
  counts,
  onClose,
  onPictureChange,
  onSignOut,
  onDelete,
  onOpen,
}: {
  open: boolean
  account: Account
  /** From the profile — one name, one place it is edited. */
  name: string
  counts: { profileDone: number; profileTotal: number; cvs: number; applications: number }
  onClose: () => void
  onPictureChange: (file: File) => void
  onSignOut: () => void
  onDelete: () => void
  onOpen: (page: 'profile' | 'applications') => void
}) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (open && !element.open) element.showModal()
  }, [open])

  return (
    <>
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
          {open ? (
            <motion.div
              className="md-dialog__panel account"
              aria-label={t('account.title')}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={SMOOTH}
            >
              <header className="account__head">
                <Picture
                  account={account}
                  name={name}
                  t={t}
                  onPictureChange={onPictureChange}
                />

                {/*
                  The name only. The email is one line down, beside the person
                  icon — printing it twice on one panel says nothing the second
                  time.
                */}
                <div className="account__who">
                  <h2>{name}</h2>
                </div>

                <Button
                  variant="outlined"
                  icon="logout"
                  className="account__signout"
                  onClick={onSignOut}
                >
                  {t('account.signOut')}
                </Button>
                <IconButton
                  icon="close"
                  className="account__close"
                  label={t('common.close')}
                  onClick={onClose}
                />
              </header>

              <div className="account__columns">
                {/*
                  No heading. An email beside a person icon and two password
                  fields are already "how you sign in" — a line of text saying
                  so is one more thing to read for nothing.
                */}
                <section className="account__card">
                  <p className="account__email">
                    <Icon name="person" size={20} />
                    <span>
                      <span className="account__email-label">
                        {t('account.email')}
                      </span>
                      {account.email}
                    </span>
                  </p>
                  <PasswordForm t={t} />
                </section>

                <section className="account__card">
                  <h3>{t('account.attached')}</h3>
                  <div className="account__attached">
                    <Attached
                      icon="person"
                      label={t('account.profile')}
                      detail={t('account.profileDone', {
                        done: counts.profileDone,
                        total: counts.profileTotal,
                      })}
                      onClick={() => onOpen('profile')}
                    />
                    <Attached
                      icon="description"
                      label={t('account.cvs')}
                      detail={t.count('account.cvCount', counts.cvs)}
                      onClick={() => onOpen('profile')}
                    />
                    <Attached
                      icon="double_arrow"
                      label={t('account.applications')}
                      detail={t('account.applicationsSent', {
                        count: counts.applications,
                      })}
                      onClick={() => onOpen('applications')}
                    />
                  </div>
                </section>
              </div>

              {/*
                Leaving, said once and at the size it deserves: the sentence,
                then the button. No heading, no red block — the confirmation
                behind it is where the weight belongs.
              */}
              <footer className="account__leaving">
                <p>{t('account.leaving')}</p>
                <Button variant="danger" small onClick={() => setLeaving(true)}>
                  {t('account.deleteAccount')}
                </Button>
              </footer>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </dialog>

      <DeleteDialog
        t={t}
        open={leaving}
        onClose={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false)
          onDelete()
        }}
      />
    </>
  )
}

/**
 * The avatar, and the only way to change it: the camera on the circle. A
 * button beside it saying "Upload a picture" would name the same thing twice.
 */
function Picture({
  account,
  name,
  t,
  onPictureChange,
}: {
  account: Account
  name: string
  t: Translate
  onPictureChange: (file: File) => void
}) {
  const id = useId()

  return (
    <span className="account__picture">
      {account.avatar_url ? (
        <img src={account.avatar_url} alt="" />
      ) : (
        <span className="account__initials" aria-hidden="true">
          {initials(name)}
        </span>
      )}

      <label className="account__camera" htmlFor={id}>
        <Icon name="photo_camera" size={18} />
        <span className="sr-only">
          {account.avatar_url
            ? t('account.changePicture')
            : t('account.addPicture')}
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept={PICTURE_FORMATS}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onPictureChange(file)
          // Cleared, so choosing the same file twice still fires a change.
          event.target.value = ''
        }}
      />
    </span>
  )
}

function PasswordForm({ t }: { t: Translate }) {
  const current = useId()
  const next = useId()
  const [changed, setChanged] = useState(false)
  const [values, setValues] = useState({ current: '', next: '' })

  const ready = values.current.length > 0 && values.next.length > 0

  return (
    <form
      className="account__password"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        setValues({ current: '', next: '' })
        setChanged(true)
      }}
    >
      <PasswordField
        id={current}
        t={t}
        label={t('account.currentPassword')}
        value={values.current}
        onChange={(value) => {
          setValues((v) => ({ ...v, current: value }))
          setChanged(false)
        }}
      />
      <PasswordField
        id={next}
        t={t}
        label={t('account.newPassword')}
        help={t('account.passwordPolicy')}
        value={values.next}
        onChange={(value) => {
          setValues((v) => ({ ...v, next: value }))
          setChanged(false)
        }}
      />

      <div className="account__password-actions">
        <Button variant="filled" type="submit" disabled={!ready}>
          {t('account.changePassword')}
        </Button>

        {/*
          The repo raises a toast. There is no toaster here, and one sentence
          beside the button it belongs to is the shorter answer — it fades in
          and the row holds its height, so nothing below it moves.
        */}
        <AnimatePresence initial={false}>
          {changed ? (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={SMOOTH}
            >
              <Icon name="check" size={18} />
              {t('account.passwordChanged')}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  )
}

/** A password field with the reveal the repo's PasswordInput has. */
function PasswordField({
  id,
  t,
  label,
  help,
  value,
  onChange,
}: {
  id: string
  t: Translate
  label: string
  help?: string
  value: string
  onChange: (value: string) => void
}) {
  const [shown, setShown] = useState(false)

  return (
    <div className="md-field account__field">
      <label className="md-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="md-field__control"
        type={shown ? 'text' : 'password'}
        autoComplete={help ? 'new-password' : 'current-password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="account__reveal"
        aria-label={shown ? t('account.hidePassword') : t('account.showPassword')}
        aria-pressed={shown}
        onClick={() => setShown((s) => !s)}
      >
        <Icon name={shown ? 'visibility_off' : 'visibility'} size={20} />
      </button>
      {help ? <p className="md-field__help">{help}</p> : null}
    </div>
  )
}

function Attached({
  icon,
  label,
  detail,
  onClick,
}: {
  icon: IconName
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <button type="button" className="account__attached-row" onClick={onClick}>
      <span className="account__attached-mark" aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <span className="account__attached-text">
        <span>{label}</span>
        <span>{detail}</span>
      </span>
      <Icon name="chevron_right" size={20} />
    </button>
  )
}

/**
 * Deleting asks for the password, because the API does. That is the whole
 * ceremony — the sentence, the field, and a button that says what it does.
 */
function DeleteDialog({
  t,
  open,
  onClose,
  onConfirm,
}: {
  t: Translate
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const id = useId()
  const [password, setPassword] = useState('')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      headline={t('account.deleteHeadline')}
      actions={
        <>
          <Button
            variant="text"
            onClick={() => {
              setPassword('')
              onClose()
            }}
          >
            {t('account.keepAccount')}
          </Button>
          <Button
            variant="danger"
            disabled={password.length === 0}
            onClick={() => {
              setPassword('')
              onConfirm()
            }}
          >
            {t('account.deleteAccount')}
          </Button>
        </>
      }
    >
      <p>{t('account.leaving')}</p>
      <div className="md-field account__field account__field--dialog">
        <label className="md-field__label" htmlFor={id}>
          {t('account.currentPassword')}
        </label>
        <input
          id={id}
          className="md-field__control"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="md-field__help">{t('account.confirmWithPassword')}</p>
      </div>
    </Dialog>
  )
}
