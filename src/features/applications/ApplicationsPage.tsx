import { useState } from 'react'
import { AnimatedItem, AnimatedList } from '../../components/AnimatedList'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { jobMeta, jobPlace, type Job } from '../jobs/data'
import { useT, type Translate } from '../../i18n/useT'
import { relativeTime } from '../../i18n/time'
import {
  APPLICATION_STATE,
  canWithdraw,
  type Application,
} from './data'

/**
 * Draft B's empty state: the next step is on the page.
 *
 * The old empty state was one sentence and a button to the job list. This one
 * puts three open roles in front of you, so the first move is a tap rather
 * than a browse-and-filter. The button underneath still goes to the full list
 * for anyone who would rather look themselves.
 *
 * `suggested` is whatever the caller considers a fit. Today that is the jobs
 * matching the candidate's own location and role — a filter over the existing
 * browse query, not a recommender.
 */
export function ApplicationsPage({
  applications,
  suggested,
  lookingFor,
  onWithdraw,
  onBrowse,
  onOpenJob,
}: {
  applications: Application[]
  suggested: Job[]
  /** What the suggestions were narrowed by, shown so it can be questioned. */
  lookingFor: string
  onWithdraw: (id: string) => void
  onBrowse: () => void
  onOpenJob: (job: Job) => void
}) {
  const t = useT()
  const [withdrawing, setWithdrawing] = useState<Application | null>(null)

  return (
    <div className="applications">
      <header className="applications__header">
        <h1>{t('applications.title')}</h1>
        <p>{t('applications.blurb')}</p>
      </header>

      {applications.length === 0 ? (
        <Empty
          suggested={suggested}
          lookingFor={lookingFor}
          onBrowse={onBrowse}
          onOpenJob={onOpenJob}
          t={t}
        />
      ) : (
        <AnimatedList
          as="ul"
          className="applications__list"
          aria-label={t('applications.listLabel')}
        >
          {applications.map((application) => (
            <AnimatedItem as="li" key={application.id}>
              <ApplicationRow
                application={application}
                t={t}
                onWithdraw={() => setWithdrawing(application)}
                onOpenJob={() => onOpenJob(application.job)}
              />
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      <ConfirmDialog
        open={withdrawing !== null}
        onClose={() => setWithdrawing(null)}
        onConfirm={() => withdrawing && onWithdraw(withdrawing.id)}
        headline={t('applications.withdrawHeadline')}
        description={t('applications.withdrawBody', {
          title: withdrawing ? t.say(withdrawing.job.title) : '',
          tenant: withdrawing ? t.say(withdrawing.job.tenant.name) : '',
        })}
        confirmLabel={t('applications.withdraw')}
        danger
      />
    </div>
  )
}

function Empty({
  suggested,
  lookingFor,
  onBrowse,
  onOpenJob,
  t,
}: {
  suggested: Job[]
  lookingFor: string
  onBrowse: () => void
  onOpenJob: (job: Job) => void
  t: Translate
}) {
  return (
    <div className="applications__empty">
      <div className="applications__empty-head">
        <span className="applications__empty-mark" aria-hidden="true">
          <Icon name="double_arrow" size={34} />
        </span>
        <h2>{t('applications.emptyTitle')}</h2>
        <p>{t('applications.emptyBody')}</p>
      </div>

      {suggested.length > 0 ? (
        <>
          <div className="applications__suggest-head">
            <div>
              <Icon name="auto_awesome" size={20} />
              <h3>{t('applications.fit')}</h3>
            </div>
            <span>{lookingFor}</span>
          </div>

          <ul className="applications__suggest">
            {suggested.map((job) => (
              <li key={job.id}>
                <a
                  href={`/jobs/${job.id}`}
                  onClick={(event) => {
                    event.preventDefault()
                    onOpenJob(job)
                  }}
                >
                  <span
                    className="applications__logo"
                    style={{ background: job.tenant.tone, color: job.tenant.ink }}
                    aria-hidden="true"
                  >
                    {job.tenant.initials}
                  </span>
                  <span className="applications__suggest-text">
                    <span className="applications__suggest-title">
                      {t.say(job.title)}
                    </span>
                    <span className="applications__suggest-meta">
                      {[t.say(job.tenant.name), jobPlace(job, t)]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <Icon name="arrow_forward" size={20} />
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <div className="applications__empty-actions">
        <Button variant="filled" icon="search" onClick={onBrowse}>
          {t('applications.browse')}
        </Button>
      </div>
    </div>
  )
}

function ApplicationRow({
  application,
  t,
  onWithdraw,
  onOpenJob,
}: {
  application: Application
  t: Translate
  onWithdraw: () => void
  onOpenJob: () => void
}) {
  const state = APPLICATION_STATE[application.stage]

  return (
    <article className="application">
      <span
        className="applications__logo"
        style={{
          background: application.job.tenant.tone,
          color: application.job.tenant.ink,
        }}
        aria-hidden="true"
      >
        {application.job.tenant.initials}
      </span>

      <div className="application__text">
        <a
          className="application__title"
          href={`/jobs/${application.job.id}`}
          onClick={(event) => {
            event.preventDefault()
            onOpenJob()
          }}
        >
          {t.say(application.job.title)}
        </a>
        <p className="application__meta">{jobMeta(application.job, t)}</p>
        <p className="application__applied">
          {t('applications.applied', {
            when: relativeTime(application.applied, t),
          })}
        </p>
      </div>

      <span className={`application__stage application__stage--${state.tone}`}>
        {t(state.label)}
      </span>

      {canWithdraw(application.stage) ? (
        <Button
          variant="danger"
          small
          onClick={onWithdraw}
          aria-label={t('applications.withdrawFrom', {
            title: t.say(application.job.title),
          })}
        >
          {t('applications.withdraw')}
        </Button>
      ) : null}
    </article>
  )
}
