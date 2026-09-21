import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { Flag } from './Flag'
import { useT } from '../i18n/useT'
import { initials, useNavControls } from './navControls'

export interface RailDestination {
  id: string
  label: string
  icon: IconName
  href: string
  /** Rendered as a badge on the icon. Omitted or 0 shows nothing. */
  badge?: number
}

interface NavRailProps {
  destinations: RailDestination[]
  activeId: string
  onNavigate: (id: string) => void
  /** Bottom cluster, above the theme switch and the account. */
  utilities: RailDestination[]
  /**
   * The account. It is the only way into the profile - there is no separate
   * Profile destination, because two entry points to one page is two things
   * to keep in sync and one more item in a list that should stay short.
   */
  account: { id: string; name: string; avatarUrl?: string }
}

function NavRailItem({
  label,
  active,
  href,
  badge,
  onClick,
  children,
}: {
  label: string
  active: boolean
  href?: string
  badge?: number
  onClick: () => void
  children: ReactNode
}) {

  const content = (
    <>
      <span className="nav-rail__indicator" aria-hidden="true" />
      <span className="nav-rail__icon-wrap">
        {children}
        {badge ? (
          <span className="nav-rail__badge">{badge > 99 ? '99+' : badge}</span>
        ) : null}
      </span>
      {/* dir="auto" so an untranslated label keeps its own direction. */}
      <span className="nav-rail__label" dir="auto">
        {label}
      </span>
    </>
  )

  // A destination is a link, so it keeps middle-click, copy-link and the
  // browser's own affordances. An action that goes nowhere is a button.
  if (href) {
    return (
      <li>
        <a
          className="nav-rail__item"
          href={href}
          aria-current={active ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault()
            onClick()
          }}
        >
          {content}
        </a>
      </li>
    )
  }

  return (
    <li>
      <button type="button" className="nav-rail__item" onClick={onClick}>
        {content}
      </button>
    </li>
  )
}

export function NavRail({
  destinations,
  activeId,
  onNavigate,
  utilities,
  account,
}: NavRailProps) {
  const t = useT()
  const { nextTheme, switchTheme, nextLanguage, switchLanguage } =
    useNavControls()

  return (
    <nav className="nav-rail" aria-label="Main navigation">
      {/* Decorative: the product name is already in the page title. */}
      <img
        className="nav-rail__logo"
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt=""
      />

      <ul className="nav-rail__group">
        {destinations.map((destination) => (
          <NavRailItem
            key={destination.id}
            label={destination.label}
            href={destination.href}
            badge={destination.badge}
            active={destination.id === activeId}
            onClick={() => onNavigate(destination.id)}
          >
            <Icon name={destination.icon} />
          </NavRailItem>
        ))}
      </ul>

      {/*
        Controls, not destinations - so circular icon buttons rather than nav
        items. `title` gives a hover tooltip; `aria-label` is what carries the
        name, since there is no visible text.
      */}
      <div className="nav-rail__bottom">
        {utilities.map((utility) => (
          <a
            key={utility.id}
            className="nav-rail__utility"
            href={utility.href}
            title={utility.label}
            aria-label={
              utility.badge
                ? t('rail.notificationsUnread', {
                    label: utility.label,
                    count: utility.badge,
                  })
                : utility.label
            }
            aria-current={utility.id === activeId ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(utility.id)
            }}
          >
            <Icon name={utility.icon} />
            {utility.badge ? (
              <span className="nav-rail__badge" aria-hidden="true">
                {utility.badge > 99 ? '99+' : utility.badge}
              </span>
            ) : null}
          </a>
        ))}

        <button
          type="button"
          className="nav-rail__utility"
          onClick={switchTheme}
          title={nextTheme === 'dark' ? t('rail.toDark') : t('rail.toLight')}
          aria-label={
            nextTheme === 'dark' ? t('rail.toDark') : t('rail.toLight')
          }
        >
          <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} />
        </button>

        {/*
          The same control as the theme switch, one row down: a circular
          button showing the thing it will switch TO — there, the other
          theme's icon; here, the other language's flag.
        */}
        <button
          type="button"
          className="nav-rail__utility"
          onClick={switchLanguage}
          title={t('rail.toLanguage', { language: nextLanguage.label })}
          aria-label={t('rail.toLanguage', { language: nextLanguage.label })}
        >
          <Flag language={nextLanguage.flag} size={24} />
        </button>

        <a
          className="nav-rail__utility nav-rail__utility--account"
          href={`/${account.id}`}
          title={account.name}
          aria-label={t('rail.account', { name: account.name })}
          aria-current={account.id === activeId ? 'page' : undefined}
          onClick={(event) => {
            event.preventDefault()
            onNavigate(account.id)
          }}
        >
          {account.avatarUrl ? (
            <img className="nav-rail__avatar" src={account.avatarUrl} alt="" />
          ) : (
            <span className="nav-rail__avatar-initials" aria-hidden="true">
              {initials(account.name)}
            </span>
          )}
        </a>
      </div>
    </nav>
  )
}
