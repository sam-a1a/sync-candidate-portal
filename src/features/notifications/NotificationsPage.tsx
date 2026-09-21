import { useState } from 'react'
import { AnimatedItem, AnimatedList } from '../../components/AnimatedList'
import { Button } from '../../components/Button'
import { Icon, type IconName } from '../../components/Icon'
import { useT, type Translate } from '../../i18n/useT'
import { relativeTime } from '../../i18n/time'
import {
  inKind,
  isUnread,
  notificationCopy,
  notificationKind,
  unreadCount,
  type Notification,
  type NotificationKind,
} from './data'

/**
 * Draft A: the pill with its count, the row of round shortcuts, and one
 * rounded sheet whose rows are separate tonal cards rather than divided lines.
 * With draft B's empty state, centred in the page.
 *
 * The copy, the three kinds, the read/unread treatment and where each one
 * opens all come from the repo's notification.ts and notification-item.tsx.
 * The shortcut row is the one thing on this page the repo does not have — it
 * filters the list by kind, which is a new feature; deleting `kinds` and the
 * `<KindShortcuts>` below removes it and nothing else.
 */
export function NotificationsPage({
  notifications,
  hasMore = false,
  onOpen,
  onBrowse,
  onLoadMore,
}: {
  notifications: Notification[]
  /** Whether the API would have a next page. */
  hasMore?: boolean
  onOpen: (notification: Notification) => void
  onBrowse: () => void
  onLoadMore?: () => void
}) {
  const t = useT()
  const [kind, setKind] = useState<NotificationKind>('all')

  const unread = unreadCount(notifications)
  const counts = {
    all: notifications.length,
    applications: notifications.filter((n) => notificationKind(n) === 'applications')
      .length,
    cvs: notifications.filter((n) => notificationKind(n) === 'cvs').length,
  }

  /* A shortcut with nothing behind it cannot be chosen, so the list it
     narrows to is never empty and the empty state below means one thing:
     nothing has happened yet. */
  const shown = notifications.filter((n) => inKind(n, kind))

  if (notifications.length === 0) {
    return (
      <div className="notifications notifications--empty">
        <Header unread={0} t={t} />
        <div className="notifications__empty">
          <span className="notifications__empty-mark" aria-hidden="true">
            <Icon name="notifications" size={32} />
          </span>
          <p>{t('notifications.nothingYet')}</p>
          <Button variant="outlined" icon="search" onClick={onBrowse}>
            {t('notifications.browse')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="notifications">
      <Header unread={unread} t={t} />

      <div className="notifications__kinds">
        <Shortcut
          icon="notifications"
          label={t('notifications.all')}
          count={counts.all}
          on={kind === 'all'}
          onSelect={() => setKind('all')}
        />
        <Shortcut
          icon="double_arrow"
          label={t('notifications.forApplications')}
          count={counts.applications}
          on={kind === 'applications'}
          onSelect={() => setKind('applications')}
        />
        <Shortcut
          icon="description"
          label={t('notifications.forCvs')}
          count={counts.cvs}
          on={kind === 'cvs'}
          onSelect={() => setKind('cvs')}
        />
      </div>

      <section className="notifications__sheet">
        <h2>{t('notifications.newestFirst')}</h2>
        <AnimatedList
          as="ul"
          className="notifications__list"
          aria-label={t('notifications.listLabel')}
        >
          {shown.map((notification) => (
            <AnimatedItem as="li" key={notification.id}>
              <Row
                notification={notification}
                t={t}
                onOpen={() => onOpen(notification)}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>

        {hasMore ? (
          <div className="notifications__more">
            <Button variant="outlined" onClick={onLoadMore}>
              {t('notifications.loadMore')}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function Header({ unread, t }: { unread: number; t: Translate }) {
  return (
    <header className="notifications__header">
      <div>
        <h1>{t('notifications.title')}</h1>
        <p>{t('notifications.blurb')}</p>
      </div>

      {/* The count sits with the title rather than over the list: it describes
          the page, and opening one takes it down in front of you. */}
      {unread > 0 ? (
        <p className="notifications__pill">
          {t('notifications.unread')}
          <span>{unread}</span>
        </p>
      ) : null}
    </header>
  )
}

function Shortcut({
  icon,
  label,
  count,
  on,
  onSelect,
}: {
  icon: IconName
  label: string
  count: number
  on: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={`notifications__kind${on ? ' notifications__kind--on' : ''}`}
      aria-pressed={on}
      disabled={count === 0}
      onClick={onSelect}
    >
      <span className="notifications__kind-mark">
        <Icon name={icon} size={26} />
        <span className="notifications__kind-count">{count}</span>
      </span>
      {label}
    </button>
  )
}

function Row({
  notification,
  t,
  onOpen,
}: {
  notification: Notification
  t: Translate
  onOpen: () => void
}) {
  const { headline, detail, icon, to } = notificationCopy(notification, t)
  const unread = isUnread(notification)
  const kind = notificationKind(notification)
  const failed = notification.payload.type === 'cv_parse_failed'

  return (
    <a
      className={`notification${unread ? ' notification--unread' : ''}`}
      href={`/${to}`}
      onClick={(event) => {
        event.preventDefault()
        onOpen()
      }}
    >
      <span
        className={`notification__mark notification__mark--${failed ? 'failed' : kind}`}
        aria-hidden="true"
      >
        <Icon name={icon} size={22} />
      </span>

      <span className="notification__text">
        {/* The repo says "Unread." out loud for a screen reader, since the dot
            and the weight are both visual. */}
        {unread ? (
          <span className="sr-only">{t('notifications.unreadPrefix')}</span>
        ) : null}
        <span className="notification__headline">{headline}</span>
        <span className="notification__detail">{detail}</span>
      </span>

      <span className="notification__end">
        <span className="notification__when">
          {relativeTime(notification.created, t)}
        </span>
        {unread ? <span className="notification__dot" aria-hidden="true" /> : null}
      </span>
    </a>
  )
}
