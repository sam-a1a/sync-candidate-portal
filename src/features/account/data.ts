/**
 * The account behind the rail's avatar.
 *
 * Mirrors what `ProfileView` carries in
 * sync-hub-v2/apps/candidate-portal/src/features/auth/current-profile.ts, minus
 * `full_name`: that is one field on one record, and the profile form already
 * edits it, so it is read from there rather than kept twice.
 *
 * The copy below is the repo's, word for word — password-rules.ts and
 * change-password-form.tsx.
 */

export interface Account {
  email: string
  /** Object URL of the picture, or null while there is none. */
  avatar_url: string | null
}

export const SEED_ACCOUNT: Account = {
  email: 'amina.haddad@example.org',
  avatar_url: null,
}

export const MINIMUM_PASSWORD_LENGTH = 8

/** What the picker accepts, and what the file input is told to show. */
export const PICTURE_FORMATS = 'image/png,image/jpeg'

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
