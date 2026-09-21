import { Icon } from './Icon'
import { Flag } from './Flag'
import { useT } from '../i18n/useT'
import { initials, useNavControls } from './navControls'
import type { RailDestination } from './NavRail'

interface NavBarProps {
  destinations: RailDestination[]
  activeId: string
  onNavigate: (id: string) => void
  /** Notifications — the one utility that is a place you can be. */
  utilities: RailDestination[]
  account: { id: string; name: string; avatarUrl?: string }
}

/**
 * The compact-window navigation: M3 Expressive's floating toolbar.
 *
 * Two pieces, and the split is the whole idea:
 *
 *   .nav-bar__top    the brand and the switches, sticky at the top
 *   .nav-bar         a pill floating over the content at the bottom
 *
 * Content runs edge to edge and scrolls UNDER the pill, so a phone spends its
 * height on the list rather than on a bar that owns 80px of it forever. The
 * destinations carry no labels: three icons a candidate meets on every screen
 * do not need naming twice, and dropping the text is what lets the bar be a
 * floating pill instead of a full-width slab.
 *
 * Notifications rides its own circle to the side of the pill. It is a place
 * you can be, so it cannot live with the switches — but it is not one of the
 * three either, and putting it inside the pill would say it is.
 */
export function NavBar({
  destinations,
  activeId,
  onNavigate,
  utilities,
  account,
}: NavBarProps) {
  const t = useT()
  const { nextTheme, switchTheme, nextLanguage, switchLanguage } =
    useNavControls()

  return (
    <>
      <header className="nav-bar__top">
        {/* Decorative: the product name is already in the page title. */}
        <img
          className="nav-bar__logo"
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
        />

        <div className="nav-bar__switches">
          <button
            type="button"
            className="nav-bar__switch"
            onClick={switchTheme}
            aria-label={
              nextTheme === 'dark' ? t('rail.toDark') : t('rail.toLight')
            }
          >
            <Icon name={nextTheme === 'dark' ? 'dark_mode' : 'light_mode'} />
          </button>

          <button
            type="button"
            className="nav-bar__switch"
            onClick={switchLanguage}
            aria-label={t('rail.toLanguage', { language: nextLanguage.label })}
          >
            <Flag language={nextLanguage.flag} size={24} />
          </button>

          <a
            className="nav-bar__switch nav-bar__switch--account"
            href={`/${account.id}`}
            aria-label={t('rail.account', { name: account.name })}
            aria-current={account.id === activeId ? 'page' : undefined}
            onClick={(event) => {
              event.preventDefault()
              onNavigate(account.id)
            }}
          >
            {account.avatarUrl ? (
              <img className="nav-bar__avatar" src={account.avatarUrl} alt="" />
            ) : (
              <span className="nav-bar__initials" aria-hidden="true">
                {initials(account.name)}
              </span>
            )}
          </a>
        </div>
      </header>

      <div className="nav-bar__dock">
        {utilities.map((utility) => (
          <a
            key={utility.id}
            className="nav-bar__lead"
            href={utility.href}
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
              <span className="nav-bar__badge" aria-hidden="true">
                {utility.badge > 99 ? '99+' : utility.badge}
              </span>
            ) : null}
          </a>
        ))}

        <nav className="nav-bar" aria-label="Main navigation">
          <ul className="nav-bar__group">
            {destinations.map((destination) => (
              <li key={destination.id}>
                <a
                  className="nav-bar__item"
                  href={destination.href}
                  /*
                   * No visible label, so the name has to be carried here or
                   * the destination has no accessible name at all.
                   */
                  aria-label={destination.label}
                  aria-current={
                    destination.id === activeId ? 'page' : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault()
                    onNavigate(destination.id)
                  }}
                >
                  <span className="nav-bar__indicator" aria-hidden="true" />
                  <span className="nav-bar__icon-wrap">
                    <Icon name={destination.icon} />
                    {destination.badge ? (
                      <span className="nav-bar__badge">
                        {destination.badge > 99 ? '99+' : destination.badge}
                      </span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
