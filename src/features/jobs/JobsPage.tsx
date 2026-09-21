import { useMemo, useState } from 'react'
import { useT, type Translate } from '../../i18n/useT'
import { relativeTime } from '../../i18n/time'
import { AnimatedItem, AnimatedList } from '../../components/AnimatedList'
import { Button, IconButton } from '../../components/Button'
import { Flag } from '../../components/Flag'
import { Icon } from '../../components/Icon'
import { SearchDialog, type SearchOption } from '../../components/SearchDialog'
import {
  JOB_LOCATIONS,
  NO_FILTERS,
  employmentKey,
  isFiltered,
  modeKey,
  jobCountry,
  jobPlace,
  matches,
  type EmploymentType,
  type Job,
  type JobFilters,
  type WorkMode,
} from './data'

/**
 * Draft C's listing: a three-across card grid with the filters inline above
 * it as chips.
 *
 * The grid over a row list because a card can carry the tags — work mode,
 * employment type, experience asked — that a single meta line has to run
 * together, and because more roles fit a screen. The chips over a standing
 * filter panel because filters here are few and the width is better spent on
 * results.
 */
export function JobsPage({
  jobs,
  onOpen,
}: {
  jobs: Job[]
  onOpen: (job: Job) => void
}) {
  const [filters, setFilters] = useState<JobFilters>(NO_FILTERS)
  const [query, setQuery] = useState('')
  const [picking, setPicking] = useState<null | 'location' | 'mode' | 'type'>(
    null,
  )
  const t = useT()

  const active = { ...filters, q: query || undefined }
  const results = useMemo(
    () => jobs.filter((job) => matches(job, active)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `active` is rebuilt each render from these two
    [jobs, filters, query],
  )

  const filtering = isFiltered(active)

  const locationLabel = filters.location
    ? (() => {
        const found = JOB_LOCATIONS.find((l) => l.value === filters.location)
        return found ? t(found.label) : t('jobs.location')
      })()
    : t('jobs.anyLocation')

  const options: Record<'location' | 'mode' | 'type', SearchOption[]> = {
    location: JOB_LOCATIONS.map((l) => ({
      id: l.value,
      label: t(l.label),
      keywords: l.country,
      leading: <Flag country={l.country} size={22} />,
    })),
    mode: (['onsite', 'hybrid', 'remote'] as WorkMode[]).map((mode) => ({
      id: mode,
      label: t(modeKey(mode)),
    })),
    type: (
      [
        'full_time',
        'part_time',
        'contract',
        'temporary',
        'internship',
        'volunteer',
      ] as EmploymentType[]
    ).map((type) => ({
      id: type,
      label: t(employmentKey(type)),
    })),
  }

  return (
    <div className="jobs">
      <header className="jobs__header">
        <div>
          <h1>{t('jobs.title')}</h1>
          <p>{t.count('jobs.open', jobs.length)}</p>
        </div>
      </header>

      <search className="jobs__filters" aria-label={t('jobs.filterLabel')}>
        <label className="jobs__search">
          <Icon name="search" size={20} />
          <input
            type="search"
            value={query}
            placeholder={t('jobs.searchPlaceholder')}
            aria-label={t('jobs.searchLabel')}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <FilterChip
          label={locationLabel}
          icon="location_on"
          clearLabel={t('jobs.clearOne', { label: locationLabel })}
          flag={JOB_LOCATIONS.find((l) => l.value === filters.location)?.country}
          on={Boolean(filters.location)}
          onOpen={() => setPicking('location')}
          onClear={() => setFilters((f) => ({ ...f, location: undefined }))}
        />
        <FilterChip
          label={filters.mode ? t(modeKey(filters.mode)) : t('jobs.workMode')}
          clearLabel={t('jobs.clearOne', { label: t('jobs.workMode') })}
          on={Boolean(filters.mode)}
          onOpen={() => setPicking('mode')}
          onClear={() => setFilters((f) => ({ ...f, mode: undefined }))}
        />
        <FilterChip
          label={
            filters.type ? t(employmentKey(filters.type)) : t('jobs.anyType')
          }
          clearLabel={t('jobs.clearOne', { label: t('jobs.employmentType') })}
          on={Boolean(filters.type)}
          onOpen={() => setPicking('type')}
          onClear={() => setFilters((f) => ({ ...f, type: undefined }))}
        />

        {filtering ? (
          <Button
            variant="text"
            onClick={() => {
              setFilters(NO_FILTERS)
              setQuery('')
            }}
          >
            {t('jobs.clearFilters')}
          </Button>
        ) : null}
      </search>

      <p className="jobs__count" aria-live="polite">
        {filtering
          ? t('jobs.count.matching', {
              count: results.length,
              total: jobs.length,
            })
          : t.count('jobs.count.all', jobs.length, { total: jobs.length })}
      </p>

      {/*
        Two different empty states, and the difference matters: nothing
        published is the platform's problem and there is nothing to do about
        it, while nothing matching is the filters' doing and is fixed by
        widening them. Showing the same sentence for both tells someone to
        clear filters they never set.
      */}
      {results.length === 0 ? (
        <div className="jobs__empty">
          <Icon name="business_center" size={40} />
          <p>
            {jobs.length === 0
              ? t('jobs.nothingPublished')
              : t('jobs.nothingMatches')}
          </p>
          {jobs.length > 0 ? (
            <Button
              variant="filled"
              onClick={() => {
                setFilters(NO_FILTERS)
                setQuery('')
              }}
            >
              {t('jobs.clearFilters')}
            </Button>
          ) : null}
        </div>
      ) : (
        <AnimatedList as="ul" className="jobs__grid" aria-label={t('jobs.listLabel')}>
          {results.map((job) => (
            <AnimatedItem as="li" key={job.id}>
              <JobCard job={job} t={t} onOpen={() => onOpen(job)} />
            </AnimatedItem>
          ))}
        </AnimatedList>
      )}

      <SearchDialog
        open={picking !== null}
        onClose={() => setPicking(null)}
        onPick={(option) => {
          if (picking === 'location') {
            setFilters((f) => ({ ...f, location: option.id }))
          } else if (picking === 'mode') {
            setFilters((f) => ({ ...f, mode: option.id as WorkMode }))
          } else if (picking === 'type') {
            setFilters((f) => ({ ...f, type: option.id as EmploymentType }))
          }
        }}
        title={
          picking === 'location'
            ? t('jobs.location')
            : picking === 'mode'
              ? t('jobs.workMode')
              : t('jobs.employmentType')
        }
        placeholder={
          picking === 'location' ? t('jobs.searchLocations') : t('common.search')
        }
        options={picking ? options[picking] : []}
      />
    </div>
  )
}

/**
 * A filter chip. Set, it shows its value and an × that clears it in place;
 * unset, it opens the picker. Two jobs in one control, but they are the two
 * things you ever want from a filter you can see.
 */
function FilterChip({
  label,
  clearLabel,
  icon,
  flag,
  on,
  onOpen,
  onClear,
}: {
  label: string
  clearLabel: string
  icon?: 'location_on'
  /** Replaces the icon once a country has been chosen. */
  flag?: string
  on: boolean
  onOpen: () => void
  onClear: () => void
}) {
  return (
    <span className={`jobs__chip${on ? ' jobs__chip--on' : ''}`}>
      <button type="button" className="jobs__chip-label" onClick={onOpen}>
        {flag ? (
          <Flag country={flag} size={18} />
        ) : icon ? (
          <Icon name={icon} size={18} />
        ) : null}
        {label}
        {on ? null : <Icon name="expand_more" size={18} />}
      </button>
      {on ? (
        <IconButton icon="close" label={clearLabel} onClick={onClear} />
      ) : null}
    </span>
  )
}

function JobCard({
  job,
  t,
  onOpen,
}: {
  job: Job
  t: Translate
  onOpen: () => void
}) {
  const place = jobPlace(job, t)
  const country = jobCountry(job)
  const tags = [
    t(modeKey(job.work_mode)),
    t(employmentKey(job.employment_type)),
    job.experience_years
      ? t('jobs.years', { years: job.experience_years })
      : null,
  ].filter((tag): tag is string => Boolean(tag))

  return (
    <article className="job-card">
      <div className="job-card__top">
        <span
          className="job-card__logo"
          style={{ background: job.tenant.tone, color: job.tenant.ink }}
          aria-hidden="true"
        >
          {job.tenant.initials}
        </span>
        <div className="job-card__org">
          <p className="job-card__tenant">{t.say(job.tenant.name)}</p>
          {place ? <p className="job-card__place">{place}</p> : null}
        </div>
        {/*
          The country, not a save button — there is no saving in Sync. A flag
          is the fastest read of where a role is; the place name underneath
          still carries the city, and a remote role gets no flag rather than a
          borrowed one.
        */}
        {country ? <Flag country={country} size={24} /> : null}
      </div>

      {/*
        A real href, so the posting can be opened in a tab and read by a screen
        reader as the link it is; the click is intercepted because this sandbox
        has no router.
      */}
      <a
        className="job-card__title"
        href={`/jobs/${job.id}`}
        onClick={(event) => {
          event.preventDefault()
          onOpen()
        }}
      >
        {t.say(job.title)}
      </a>

      <ul className="job-card__tags">
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      <p className="job-card__posted">
        <Icon name="schedule" size={16} />
        {t('jobs.posted', { when: relativeTime(job.posted, t) })}
      </p>
    </article>
  )
}
