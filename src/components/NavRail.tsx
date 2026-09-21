import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { Icon, type IconName } from './Icon'
import { Flag } from './Flag'
import { useTheme } from '../theme/useTheme'
import { useT } from '../i18n/useT'
import { transitionTheme, type Language } from '../theme/theme'

/** The two languages the app ships, and the flag each one wears. */
const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'en-us' },
  { code: 'ar', label: 'العربية', flag: 'ar' },
]

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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
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
  const { resolvedTheme, setMode, language, setLanguage } = useTheme()
  const t = useT()

  /*
   * A plain two-state switch. The provider still resolves `system` for a first
   * visit, so the app opens in whatever the OS prefers - but once someone has
   * an opinion, "follow the system" is not a third thing they want to click
   * past to get back to light. The button shows the theme it will switch TO.
   */
  const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

  const switchTheme = () => {
    // flushSync: the view transition snapshots the DOM as soon as this
    // returns, so the attribute has to be on <html> by then.
    transitionTheme(() => flushSync(() => setMode(nextTheme)))
  }

  /*
   * Language rides the same cross-fade as the theme. Switching writing
   * direction repaints every surface at once — the rail changes side, every
   * logical property flips, the typeface changes — which is exactly the flash
   * a view transition exists to smooth over.
   */
  const switchLanguage = (next: Language) => {
    if (next === language) return
    transitionTheme(() => flushSync(() => setLanguage(next)))
  }

  const nextLanguage =
    LANGUAGES.find((entry) => entry.code !== language) ?? LANGUAGES[0]

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
          onClick={() => switchLanguage(nextLanguage.code)}
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
