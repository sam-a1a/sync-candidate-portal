/**
 * Application shapes, mirroring
 * sync-hub-v2/apps/candidate-portal/src/features/applications/application.ts.
 */

import type { Job } from '../jobs/data'
import type { StringKey } from '../../i18n/strings'
import type { Relative } from '../../i18n/time'

export type ApplicationStage =
  | 'received'
  | 'in_review'
  | 'hired'
  | 'not_selected'
  | 'withdrawn'

export interface StageState {
  /** A string key — the words are looked up where the badge is drawn. */
  label: StringKey
  tone: 'new' | 'reviewing' | 'hired' | 'rejected' | 'withdrawn'
}

export const APPLICATION_STATE: Record<ApplicationStage, StageState> = {
  received: { label: 'stage.received', tone: 'new' },
  in_review: { label: 'stage.in_review', tone: 'reviewing' },
  hired: { label: 'stage.hired', tone: 'hired' },
  not_selected: { label: 'stage.not_selected', tone: 'rejected' },
  withdrawn: { label: 'stage.withdrawn', tone: 'withdrawn' },
}

export interface Application {
  id: string
  job: Job
  stage: ApplicationStage
  applied: Relative
  /** Set when an employer claims they hired you and you have not answered. */
  hireClaimPending?: boolean
}

/** Withdrawing is only offered while a decision is still possible. */
export function canWithdraw(stage: ApplicationStage): boolean {
  return stage === 'received' || stage === 'in_review'
}
