import type { RailDestination } from '../components/NavRail'

/*
 * `label` is a string KEY, not a label: the rail is drawn in whichever
 * language is set, so the words are looked up where they are rendered.
 */

/**
 * Candidate portal destinations, matching the routes in
 * sync-hub-v2/apps/candidate-portal.
 *
 * The old top bar carried three (Jobs, Applications, Profile) and buried CVs,
 * Notifications and Settings in an account dropdown. A rail has room to
 * surface CVs as a destination, which is where candidates actually spend
 * their time, and to give Notifications a permanent home with a badge instead
 * of a bell that only appears once you open a menu.
 *
 * Profile is deliberately NOT here: the account avatar at the foot of the rail
 * goes to the same page, and one page with two entry points is a list item
 * paying rent for nothing.
 */
export const DESTINATIONS: RailDestination[] = [
  { id: 'jobs', label: 'rail.jobs', icon: 'work', href: '/jobs' },
  {
    id: 'applications',
    label: 'rail.applications',
    icon: 'double_arrow',
    href: '/applications',
  },
  { id: 'profile', label: 'rail.profile', icon: 'person', href: '/profile' },
]

/** The bottom cluster, pinned away from the destinations above. */
export const UTILITIES: RailDestination[] = [
  {
    id: 'notifications',
    label: 'rail.notifications',
    icon: 'notifications',
    href: '/notifications',
    badge: 3,
  },
]
