/**
 * Notification shapes, mirroring
 * sync-hub-v2/apps/candidate-portal/src/features/notifications/notification.ts.
 *
 * The payload union, the copy each type produces and where each one opens are
 * all kept identical — swapping the seed for the real query is a matter of
 * changing where the array comes from.
 */

import type { IconName } from '../../components/Icon'
import type { Relative } from '../../i18n/time'
import type { L } from '../../i18n/useT'
import type { Translate } from '../../i18n/useT'
import { APPLICATION_STATE, type ApplicationStage } from '../applications/data'

export const NOTIFICATIONS_PAGE_SIZE = 20

export const RECENT_NOTIFICATIONS = 5


export type NotificationPayload =
  | { type: 'cv_parse_failed'; display_name: string }
  | { type: 'cv_parse_succeeded'; display_name: string; cv_id: string }
  | {
      type: 'application_stage_changed'
      job_title: L
      tenant_name: L
      previous_stage: ApplicationStage
      stage: ApplicationStage
    }

export interface Notification {
  id: string
  payload: NotificationPayload
  /** As `relativeTime(created_at)` would phrase it. */
  created: Relative
  /** Null until it has been opened, exactly like the API's `read_at`. */
  read_at: string | null
}

export function isUnread(notification: Notification): boolean {
  return notification.read_at == null
}

export function unreadCount(notifications: Notification[]): number {
  return notifications.filter(isUnread).length
}

export interface NotificationCopy {
  headline: string
  detail: string
  icon: IconName
  /** Which page opening it lands on. */
  to: 'profile' | 'applications'
}

export function notificationCopy(
  { payload }: Notification,
  t: Translate,
): NotificationCopy {
  switch (payload.type) {
    case 'cv_parse_failed':
      return {
        headline: t('notifications.cvFailed', { name: payload.display_name }),
        detail: t('notifications.cvFailedDetail'),
        icon: 'error',
        to: 'profile',
      }
    case 'cv_parse_succeeded':
      return {
        headline: t('notifications.cvRead', { name: payload.display_name }),
        detail: t('notifications.cvReadDetail'),
        icon: 'auto_awesome',
        to: 'profile',
      }
    case 'application_stage_changed':
      return {
        headline: t('notifications.stageMoved', {
          title: t.say(payload.job_title),
          tenant: t.say(payload.tenant_name),
        }),
        detail: t('notifications.stageMovedDetail', {
          from: t(APPLICATION_STATE[payload.previous_stage].label),
          to: t(APPLICATION_STATE[payload.stage].label),
        }),
        /* The rail's Applications icon, so one mark means one thing. */
        icon: 'double_arrow',
        to: 'applications',
      }
  }
}

/**
 * The two things a notification is ever about. Draft A's shortcut row narrows
 * the list to one of them — the one thing on that page the repo does not have
 * today, and the only place this type is used.
 */
export type NotificationKind = 'all' | 'applications' | 'cvs'

export function notificationKind(notification: Notification): 'applications' | 'cvs' {
  return notification.payload.type === 'application_stage_changed'
    ? 'applications'
    : 'cvs'
}

export function inKind(notification: Notification, kind: NotificationKind): boolean {
  return kind === 'all' || notificationKind(notification) === kind
}

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    payload: {
      type: 'application_stage_changed',
      job_title: { en: 'Field Coordinator', ar: 'منسّق ميداني' },
      tenant_name: { en: 'Norwegian Refugee Council', ar: 'المجلس النرويجي للاجئين' },
      previous_stage: 'received',
      stage: 'in_review',
    },
    created: { unit: 'hour', value: 2 },
    read_at: null,
  },
  {
    id: 'n2',
    payload: {
      type: 'cv_parse_succeeded',
      display_name: 'Amina-Haddad-2026.pdf',
      cv_id: 'c1',
    },
    created: { unit: 'yesterday' },
    read_at: null,
  },
  {
    id: 'n3',
    payload: { type: 'cv_parse_failed', display_name: 'CV-francais-2024.docx' },
    created: { unit: 'day', value: 2 },
    read_at: null,
  },
  {
    id: 'n4',
    payload: {
      type: 'application_stage_changed',
      job_title: { en: 'Programme Manager — Shelter', ar: 'مدير برنامج — المأوى' },
      tenant_name: { en: 'Save the Children', ar: 'أنقذوا الأطفال' },
      previous_stage: 'in_review',
      stage: 'not_selected',
    },
    created: { unit: 'day', value: 4 },
    read_at: '4 days ago',
  },
  {
    id: 'n5',
    payload: {
      type: 'application_stage_changed',
      job_title: { en: 'MEAL Officer', ar: 'مسؤول رصد وتقييم' },
      tenant_name: { en: 'International Rescue Committee', ar: 'لجنة الإنقاذ الدولية' },
      previous_stage: 'received',
      stage: 'in_review',
    },
    created: { unit: 'week', value: 1 },
    read_at: '1 week ago',
  },
  {
    id: 'n6',
    payload: {
      type: 'cv_parse_succeeded',
      display_name: 'Amina-Haddad-2025.pdf',
      cv_id: 'c1',
    },
    created: { unit: 'week', value: 3 },
    read_at: '3 weeks ago',
  },
]
