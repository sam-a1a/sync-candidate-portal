import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { AnimatedItem, AnimatedList } from '../../components/AnimatedList'
import { Button, IconButton } from '../../components/Button'
import { ConfirmDialog, Dialog } from '../../components/Dialog'
import { ExpansionPanel } from '../../components/ExpansionPanel'
import {
  SegmentedButton,
  SelectField,
  Switch,
  TextArea,
  TextField,
} from '../../components/Field'
import { Flag } from '../../components/Flag'
import { Icon } from '../../components/Icon'
import { SearchDialog, type SearchOption } from '../../components/SearchDialog'
import { SkillIcon } from '../../components/SkillIcon'
import { useT } from '../../i18n/useT'
import { relativeTime } from '../../i18n/time'
import { languageName } from '../jobs/data'
import type { StringKey } from '../../i18n/strings'
import {
  DIAL_CODE_CATALOGUE,
  LANGUAGE_CATALOGUE,
  SKILL_CATALOGUE,
  TOOL_CATALOGUE,
  skillName,
} from './catalogues'
import {
  LOCATIONS,
  MAX_CVS,
  type DraftField,
  PARSE_STATES,
  PROFICIENCIES,
  ROLES,
  totalExperienceYears,
  type Cv,
  type Profile,
  type Proficiency,
} from './data'

/**
 * Panels that hold collapsible entries take their open state from above, so a
 * panel you collapsed is still collapsed when you come back to the tab. Held
 * locally it died with the component on every tab change.
 */
interface Collapsible {
  openId: string | null
  onToggle: (id: string | null) => void
}

function SectionHead({
  title,
  blurb,
  needed,
  action,
}: {
  title: string
  blurb: string
  needed?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="profile__section-head">
      <div className="profile__section-title">
        <h2>{title}</h2>
        {needed ? <span className="profile__needed">{needed}</span> : null}
        <span className="profile__blurb">{blurb}</span>
      </div>
      {action ? (
        <Button variant="outlined" icon="add" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}

/** Confirm-before-removing. Every destructive action goes through one. */
function RemoveButton({
  what,
  description,
  onRemove,
}: {
  what: string
  description: string
  onRemove: () => void
}) {
  const t = useT()
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      <Button
        variant="danger"
        small
        icon="delete"
        onClick={() => setConfirming(true)}
      >
        {t('common.remove')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={onRemove}
        headline={t('common.remove') + ` ${what}?`}
        description={description}
        confirmLabel={t('common.remove')}
        danger
      />
    </>
  )
}

/* ---------------------------------------------------------------- About */

export function AboutPanel({
  profile,
  onChange,
  was,
  fromCvName,
}: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
  /* What a field said before a CV filled it, for the ones it changed. */
  was: Partial<Record<DraftField, string>>
  fromCvName: string | null
}) {
  const t = useT()

  /*
   * A field the CV changed says so on its own help line, and says what it
   * replaced — the only way to see what the reader got wrong without
   * remembering what you had written.
   */
  const mark = (field: DraftField, fallback?: string) =>
    was[field] === undefined
      ? { className: undefined, help: fallback }
      : {
          className: 'is-from-cv',
          help: t('profile.fromCv', {
            name: fromCvName ?? '',
            was: was[field] || t('profile.wasEmpty'),
          }),
        }

  const [pickingCode, setPickingCode] = useState(false)

  const dial =
    DIAL_CODE_CATALOGUE.find((entry) => entry.code === profile.phone_country) ??
    DIAL_CODE_CATALOGUE[0]

  const codeOptions: SearchOption[] = DIAL_CODE_CATALOGUE.map((entry) => ({
    // Codes are not unique (+1 is the US and Canada), so the country is the id.
    id: entry.country,
    label: entry.label,
    keywords: `${entry.code} ${entry.country}`,
    leading: <Flag country={entry.country} size={22} />,
    trailing: entry.code,
  }))

  return (
    <>
      <SectionHead
        title={t('about.title')}
        blurb={t('about.blurb')}
        needed={profile.canonical_role_key ? undefined : '1 still needed'}
      />
      <div className="profile__grid">
        <TextField
          label={t('about.fullName')}
          value={profile.full_name}
          autoComplete="name"
          {...mark('full_name')}
          onChange={(e) => onChange({ full_name: e.target.value })}
        />

        {/*
          One grid cell, not two. The dialling code used to be a second field
          beside this one, which made the pair narrower than every other cell
          and broke the column. It is now a button that opens a searchable
          picker — which also gives the flag somewhere to live, since a
          <select> cannot hold an image.
        */}
        <div className="md-field profile__phone">
          <span className="md-field__label">{t('about.phone')}</span>
          <div className="profile__phone-row">
            <button
              type="button"
              className="profile__dial"
              onClick={() => setPickingCode(true)}
              aria-label={t('about.dialCode', { label: dial.label, code: dial.code })}
            >
              <Flag country={dial.country} size={20} />
              <span>{dial.code}</span>
              <Icon name="expand_more" size={18} />
            </button>
            <input
              className="profile__phone-number"
              value={profile.phone}
              inputMode="tel"
              aria-label={t('about.phoneNumber')}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </div>
          <p className="md-field__help">
            {was.phone === undefined
              ? t('about.phoneHelp')
              : t('profile.fromCv', {
                  name: fromCvName ?? '',
                  was: was.phone || t('profile.wasEmpty'),
                })}
          </p>
        </div>

        <TextField
          label={t('about.headline')}
          value={profile.headline}
          placeholder={t('about.headlinePlaceholder')}
          {...mark('headline', t('about.headlineHelp'))}
          className={`profile__span-2${was.headline === undefined ? '' : ' is-from-cv'}`}
          onChange={(e) => onChange({ headline: e.target.value })}
        />
        <SelectField
          label={t('about.location')}
          value={profile.location_key}
          onChange={(e) => onChange({ location_key: e.target.value })}
        >
          {LOCATIONS.map((l) => (
            <option key={l.value} value={l.value}>
              {t(l.label)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('about.role')}
          value={profile.canonical_role_key}
          error={
            profile.canonical_role_key
              ? undefined
              : t('about.roleNeeded')
          }
          onChange={(e) => onChange({ canonical_role_key: e.target.value })}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.label)}
            </option>
          ))}
        </SelectField>
        <TextArea
          label={t('about.summary')}
          value={profile.summary}
          rows={5}
          {...mark('summary', t('about.summaryHelp'))}
          className={`profile__span-2${was.summary === undefined ? '' : ' is-from-cv'}`}
          onChange={(e) => onChange({ summary: e.target.value })}
        />
      </div>

      <SearchDialog
        open={pickingCode}
        onClose={() => setPickingCode(false)}
        onPick={(option) => {
          const picked = DIAL_CODE_CATALOGUE.find(
            (entry) => entry.country === option.id,
          )
          if (picked) onChange({ phone_country: picked.code })
        }}
        title={t('about.countryCode')}
        placeholder={t('about.searchCountry')}
        options={codeOptions}
      />
    </>
  )
}

/* ----------------------------------------------------------- Experience */

const MONTHS = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function period(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  current: boolean,
  now: string,
  noDates: string,
): string {
  const from = [MONTHS[Number(startMonth) || 0], startYear]
    .filter(Boolean)
    .join(' ')
  const to = current
    ? now
    : [MONTHS[Number(endMonth) || 0], endYear].filter(Boolean).join(' ')
  if (!from && !to) return noDates
  return `${from || '?'} – ${to || '?'}`
}

export function ExperiencePanel({
  profile,
  onChange,
  openId,
  onToggle,
}: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
} & Collapsible) {
  const t = useT()
  const update = (id: string, patch: Partial<Profile['experiences'][0]>) =>
    onChange({
      experiences: profile.experiences.map((job) =>
        job.id === id ? { ...job, ...patch } : job,
      ),
    })

  const add = () => {
    const id = `e${Date.now()}`
    onChange({
      experiences: [
        ...profile.experiences,
        {
          id,
          job_title: '',
          company_name: '',
          start_month: '',
          start_year: '',
          end_month: '',
          end_year: '',
          is_current: false,
          description: '',
        },
      ],
    })
    onToggle(id)
  }

  const years = totalExperienceYears(profile)

  return (
    <>
      <SectionHead
        title={t('experience.title')}
        blurb={t('experience.blurb')}
        action={{ label: t('experience.add'), onClick: add }}
      />

      <p className="profile__callout">
        <Icon name="work" size={20} />
        <span>
          {t('experience.totalLabel')}{' '}
          <strong>{t.count('experience.yearCount', years)}</strong>
          {t('experience.totalTail')}
        </span>
      </p>

      <AnimatedList className="profile__stack">
        {profile.experiences.map((job) => (
          <AnimatedItem key={job.id}>
            <ExpansionPanel
              title={job.job_title || t('experience.untitled')}
              supporting={`${job.company_name || t('experience.noEmployer')} · ${period(job.start_month, job.start_year, job.end_month, job.end_year, job.is_current, t('experience.present'), t('period.noDates'))}`}
              chip={job.is_current ? 'Current' : undefined}
              open={openId === job.id}
              onToggle={() => onToggle(openId === job.id ? null : job.id)}
            >
              <div className="profile__grid">
                <TextField
                  label={t('experience.jobTitle')}
                  value={job.job_title}
                  onChange={(e) => update(job.id, { job_title: e.target.value })}
                />
                <TextField
                  label={t('experience.employer')}
                  value={job.company_name}
                  onChange={(e) =>
                    update(job.id, { company_name: e.target.value })
                  }
                />
                {/*
                  The switch sits ABOVE the dates, on its own full-width row.
                  It used to come after them, so unchecking inserted the end
                  fields before it and shoved it onto the next line — the
                  control you just touched moving out from under the cursor.
                  Here the switch never moves; the end fields simply appear
                  beside the start ones in the space already there.
                */}
                <div className="profile__switch-row profile__span-2">
                  <Switch
                    label={t('experience.stillHere')}
                    checked={job.is_current}
                    onChange={(is_current) =>
                      update(job.id, { is_current, end_month: '', end_year: '' })
                    }
                  />
                  <span>{t('experience.stillHere')}</span>
                </div>

                <div className="profile__dates profile__span-2">
                  <div className="profile__period">
                    <SelectField
                      label={t('experience.startMonth')}
                      value={job.start_month}
                      onChange={(e) =>
                        update(job.id, { start_month: e.target.value })
                      }
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m || 'none'} value={i ? String(i) : ''}>
                          {m || '—'}
                        </option>
                      ))}
                    </SelectField>
                    <TextField
                      label={t('experience.startYear')}
                      value={job.start_year}
                      inputMode="numeric"
                      onChange={(e) =>
                        update(job.id, { start_year: e.target.value })
                      }
                    />
                  </div>

                  <AnimatePresence initial={false}>
                    {job.is_current ? null : (
                      <motion.div
                        key="end"
                        className="profile__period"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <SelectField
                          label={t('experience.endMonth')}
                          value={job.end_month}
                          onChange={(e) =>
                            update(job.id, { end_month: e.target.value })
                          }
                        >
                          {MONTHS.map((m, i) => (
                            <option key={m || 'none'} value={i ? String(i) : ''}>
                              {m || '—'}
                            </option>
                          ))}
                        </SelectField>
                        <TextField
                          label={t('experience.endYear')}
                          value={job.end_year}
                          inputMode="numeric"
                          onChange={(e) =>
                            update(job.id, { end_year: e.target.value })
                          }
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <TextArea
                  label={t('experience.whatYouDid')}
                  value={job.description}
                  rows={3}
                  className="profile__span-2"
                  onChange={(e) =>
                    update(job.id, { description: e.target.value })
                  }
                />
              </div>
              <div className="profile__entry-actions">
                <RemoveButton
                  what={job.job_title || 'this job'}
                  description={t('experience.removeWhy')}
                  onRemove={() =>
                    onChange({
                      experiences: profile.experiences.filter(
                        (e) => e.id !== job.id,
                      ),
                    })
                  }
                />
              </div>
            </ExpansionPanel>
          </AnimatedItem>
        ))}
      </AnimatedList>
    </>
  )
}

/* ------------------------------------------------------------ Education */

export function EducationPanel({
  profile,
  onChange,
  openId,
  onToggle,
}: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
} & Collapsible) {
  const t = useT()
  const update = (id: string, patch: Partial<Profile['educations'][0]>) =>
    onChange({
      educations: profile.educations.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    })

  const add = () => {
    const id = `d${Date.now()}`
    onChange({
      educations: [
        ...profile.educations,
        {
          id,
          institution: '',
          degree: '',
          field_of_study: '',
          graduation_year: '',
          description: '',
        },
      ],
    })
    onToggle(id)
  }

  return (
    <>
      <SectionHead
        title={t('education.title')}
        blurb={t('education.blurb')}
        needed={profile.educations.length ? undefined : t('education.needed')}
        action={{ label: t('education.add'), onClick: add }}
      />

      <AnimatedList className="profile__stack">
        {profile.educations.length === 0 ? (
          <AnimatedItem key="empty">
            <p className="profile__empty">
              No qualifications listed yet — add a degree, diploma or course.
            </p>
          </AnimatedItem>
        ) : (
          profile.educations.map((entry) => (
            <AnimatedItem key={entry.id}>
              <ExpansionPanel
                title={entry.institution || t('education.untitled')}
                supporting={
                  [entry.degree, entry.field_of_study, entry.graduation_year]
                    .filter(Boolean)
                    .join(' · ') || t('education.noDetails')
                }
                open={openId === entry.id}
                onToggle={() => onToggle(openId === entry.id ? null : entry.id)}
              >
                <div className="profile__grid">
                  <TextField
                    label={t('education.institution')}
                    value={entry.institution}
                    className="profile__span-2"
                    onChange={(e) =>
                      update(entry.id, { institution: e.target.value })
                    }
                  />
                  <TextField
                    label={t('education.degree')}
                    value={entry.degree}
                    onChange={(e) =>
                      update(entry.id, { degree: e.target.value })
                    }
                  />
                  <TextField
                    label={t('education.field')}
                    value={entry.field_of_study}
                    onChange={(e) =>
                      update(entry.id, { field_of_study: e.target.value })
                    }
                  />
                  <TextField
                    label={t('education.year')}
                    value={entry.graduation_year}
                    inputMode="numeric"
                    onChange={(e) =>
                      update(entry.id, { graduation_year: e.target.value })
                    }
                  />
                  <TextArea
                    label={t('education.notes')}
                    value={entry.description}
                    rows={2}
                    className="profile__span-2"
                    onChange={(e) =>
                      update(entry.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="profile__entry-actions">
                  <RemoveButton
                    what={entry.institution || 'this qualification'}
                    description={t('education.removeWhy')}
                    onRemove={() =>
                      onChange({
                        educations: profile.educations.filter(
                          (d) => d.id !== entry.id,
                        ),
                      })
                    }
                  />
                </div>
              </ExpansionPanel>
            </AnimatedItem>
          ))
        )}
      </AnimatedList>
    </>
  )
}

/* --------------------------------------------------------------- Skills */

export function SkillsPanel({
  profile,
  onChange,
}: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
}) {
  const t = useT()
  const [picking, setPicking] = useState(false)
  const [naming, setNaming] = useState(false)

  /*
   * A skill is stored by its English name — that is its id on the platform —
   * and shown in the language being read. Keeping the id English means a
   * profile filled in Arabic still matches a job posted in English.
   */
  const options: SearchOption[] = SKILL_CATALOGUE.map((skill) => ({
    id: skill.en,
    label: t.say(skill),
    keywords: `${skill.en} ${skill.ar}`,
    leading: <SkillIcon skill={skill.en} size={18} />,
    taken: profile.skills.includes(skill.en),
  }))

  const toolOptions: SearchOption[] = TOOL_CATALOGUE.map((tool) => ({
    id: tool,
    label: tool,
    leading: <SkillIcon skill={tool} size={18} />,
    taken: profile.unmapped_skills.includes(tool),
  }))

  return (
    <>
      <SectionHead
        title={t('skills.title')}
        blurb={t('skills.blurb')}
        action={{ label: t('skills.add'), onClick: () => setPicking(true) }}
      />
      <AnimatedList as="ul" className="md-chip-set profile__chips">
        {profile.skills.map((skill) => (
          <AnimatedItem as="li" key={skill} className="md-chip">
            <SkillIcon skill={skill} />
            {skillName(skill, t.locale)}
            <IconButton
              icon="close"
              label={t('skills.remove', { skill: skillName(skill, t.locale) })}
              onClick={() =>
                onChange({ skills: profile.skills.filter((s) => s !== skill) })
              }
            />
          </AnimatedItem>
        ))}
      </AnimatedList>

      <SectionHead
        title={t('skills.otherTitle')}
        blurb={t('skills.otherBlurb')}
        action={{ label: t('skills.addOther'), onClick: () => setNaming(true) }}
      />
      <AnimatedList as="ul" className="md-chip-set profile__chips">
        {profile.unmapped_skills.map((skill, index) => (
          <AnimatedItem
            as="li"
            key={`unmapped-${index}`}
            className="md-chip md-chip--outlined"
          >
            <SkillIcon skill={skill} />
            {skill}
            <IconButton
              icon="close"
              label={t('skills.remove', { skill })}
              onClick={() =>
                onChange({
                  unmapped_skills: profile.unmapped_skills.filter(
                    (_, i) => i !== index,
                  ),
                })
              }
            />
          </AnimatedItem>
        ))}
      </AnimatedList>

      <SearchDialog
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(option) =>
          onChange({ skills: [...profile.skills, option.label] })
        }
        title={t('skills.add')}
        placeholder={t('skills.search')}
        options={options}
        emptyMessage={t('skills.noMatch')}
      />

      {/*
        Also a search. The list is tools, software and standards rather than
        the platform's skills — but it is still a list, so picking beats typing
        ("PowerBI", "Power-BI" and "power bi" are one tool and three strings).
        onCreate keeps the free-text escape hatch for anything not on it.
      */}
      <SearchDialog
        open={naming}
        onClose={() => setNaming(false)}
        onPick={(option) =>
          onChange({
            unmapped_skills: [...profile.unmapped_skills, option.label],
          })
        }
        onCreate={(value) =>
          onChange({ unmapped_skills: [...profile.unmapped_skills, value] })
        }
        title={t('skills.addOther')}
        placeholder={t('skills.searchTools')}
        options={toolOptions}
      />
    </>
  )
}

/* ------------------------------------------------------------ Languages */

export function LanguagesPanel({
  profile,
  onChange,
}: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
}) {
  const t = useT()
  const [picking, setPicking] = useState(false)

  const options: SearchOption[] = LANGUAGE_CATALOGUE.map((language) => ({
    id: language.code,
    label: languageName(language.code, t.locale),
    // The endonym is searched too, so typing العربية finds Arabic.
    keywords: `${language.endonym} ${language.code}`,
    leading: <Flag language={language.flag} size={22} />,
    trailing: language.endonym,
    taken: profile.languages.some((l) => l.code === language.code),
  }))

  return (
    <>
      <SectionHead
        title={t('languages.title')}
        blurb={t('languages.blurb')}
        needed={profile.languages.length ? undefined : t('languages.needed')}
        action={{ label: t('languages.add'), onClick: () => setPicking(true) }}
      />

      <AnimatedList as="ul" className="profile__languages">
        {profile.languages.length === 0 ? (
          <AnimatedItem as="li" key="empty">
            <p className="profile__empty">{t('languages.none')}</p>
          </AnimatedItem>
        ) : (
          profile.languages.map((language) => (
            <AnimatedItem as="li" key={language.id}>
              <span className="profile__language-name">
                <Flag language={language.flag} size={24} />
                {languageName(language.code, t.locale)}
              </span>
              <SegmentedButton<Proficiency>
                label={t('languages.proficiency', {
                  language: languageName(language.code, t.locale),
                })}
                value={language.proficiency}
                options={PROFICIENCIES}
                onChange={(proficiency) =>
                  onChange({
                    languages: profile.languages.map((l) =>
                      l.id === language.id ? { ...l, proficiency } : l,
                    ),
                  })
                }
              />
              <IconButton
                icon="delete"
                danger
                label={t('languages.remove', {
                  language: languageName(language.code, t.locale),
                })}
                onClick={() =>
                  onChange({
                    languages: profile.languages.filter(
                      (l) => l.id !== language.id,
                    ),
                  })
                }
              />
            </AnimatedItem>
          ))
        )}
      </AnimatedList>

      <SearchDialog
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(option) => {
          const picked = LANGUAGE_CATALOGUE.find(
            (language) => language.code === option.id,
          )
          if (!picked) return
          onChange({
            languages: [
              ...profile.languages,
              {
                id: `l${Date.now()}`,
                code: picked.code,
                name: picked.name,
                proficiency: 'intermediate',
                flag: picked.flag,
              },
            ],
          })
        }}
        title={t('languages.add')}
        placeholder={t('languages.search')}
        options={options}
      />
    </>
  )
}

/* ------------------------------------------------------- Projects & links */

export function ProjectsPanel({
  profile,
  onChange,
  openId,
  onToggle,
}: {
  profile: Profile
  onChange: (patch: Partial<Profile>) => void
} & Collapsible) {
  const t = useT()
  const add = () => {
    const id = `p${Date.now()}`
    onChange({
      projects: [
        ...profile.projects,
        {
          id,
          name: '',
          description: '',
          project_url: '',
          repository_url: '',
          start_year: '',
          end_year: '',
        },
      ],
    })
    onToggle(id)
  }

  const update = (id: string, patch: Partial<Profile['projects'][0]>) =>
    onChange({
      projects: profile.projects.map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    })

  return (
    <>
      <SectionHead
        title={t('projects.title')}
        blurb={t('projects.blurb')}
        action={{ label: t('projects.add'), onClick: add }}
      />

      <AnimatedList className="profile__stack">
        {profile.projects.length === 0 ? (
          <AnimatedItem key="empty">
            <p className="profile__empty">
              No projects listed yet — add something you built or ran.
            </p>
          </AnimatedItem>
        ) : (
          profile.projects.map((project) => (
            <AnimatedItem key={project.id}>
              <ExpansionPanel
                title={project.name || t('projects.untitled')}
                supporting={
                  [project.start_year, project.end_year]
                    .filter(Boolean)
                    .join(' – ') || t('period.noDates')
                }
                open={openId === project.id}
                onToggle={() =>
                  onToggle(openId === project.id ? null : project.id)
                }
              >
                <div className="profile__grid">
                  <TextField
                    label={t('projects.name')}
                    value={project.name}
                    className="profile__span-2"
                    onChange={(e) =>
                      update(project.id, { name: e.target.value })
                    }
                  />
                  <TextField
                    label={t('projects.link')}
                    value={project.project_url}
                    onChange={(e) =>
                      update(project.id, { project_url: e.target.value })
                    }
                  />
                  <TextField
                    label={t('projects.repository')}
                    value={project.repository_url}
                    onChange={(e) =>
                      update(project.id, { repository_url: e.target.value })
                    }
                  />
                  <TextArea
                    label={t('projects.what')}
                    value={project.description}
                    rows={2}
                    className="profile__span-2"
                    onChange={(e) =>
                      update(project.id, { description: e.target.value })
                    }
                  />
                </div>
                <div className="profile__entry-actions">
                  <RemoveButton
                    what={project.name || 'this project'}
                    description={t('education.removeWhy')}
                    onRemove={() =>
                      onChange({
                        projects: profile.projects.filter(
                          (p) => p.id !== project.id,
                        ),
                      })
                    }
                  />
                </div>
              </ExpansionPanel>
            </AnimatedItem>
          ))
        )}
      </AnimatedList>

      <SectionHead
        title={t('links.title')}
        blurb={t('links.blurb')}
      />
      <div className="profile__grid">
        <TextField
          label={t('links.linkedin')}
          value={profile.linkedin_url}
          placeholder="linkedin.com/in/amina-haddad"
          onChange={(e) => onChange({ linkedin_url: e.target.value })}
        />
        <TextField
          label={t('links.github')}
          value={profile.github_url}
          placeholder="github.com/amina-haddad"
          onChange={(e) => onChange({ github_url: e.target.value })}
        />
        <TextField
          label={t('links.portfolio')}
          value={profile.portfolio_url}
          className="profile__span-2"
          help={t('links.portfolioHelp')}
          onChange={(e) => onChange({ portfolio_url: e.target.value })}
        />
      </div>
    </>
  )
}

/* -------------------------------------------------------------------- CVs */

export function CvsPanel({
  cvs,
  onChange,
  onAskUpdate,
}: {
  cvs: Cv[]
  onChange: (next: Cv[]) => void
  onAskUpdate: (cv: Cv) => void
}) {
  const t = useT()
  const [makingCurrent, setMakingCurrent] = useState<Cv | null>(null)
  const [deleting, setDeleting] = useState<Cv | null>(null)
  const slotsLeft = Math.max(MAX_CVS - cvs.length, 0)

  return (
    <>
      {/*
        Only the CVs. Upload moved up to the header, where it belongs with the
        other thing you do to the whole profile, so this tab is a list of what
        you have and nothing else. The slot count rides the blurb, because it
        is a fact about the list.
      */}
      <SectionHead
        title="CVs"
        blurb={`The current CV goes out with every application. ${
          slotsLeft === 0
            ? `You are keeping all ${MAX_CVS} we hold — delete one to upload again.`
            : `${slotsLeft} of ${MAX_CVS} slots free.`
        }`}
      />

      <AnimatedList as="ul" className="profile__stack" aria-label="Your CVs">
        {cvs.map((cv) => {
          const state = PARSE_STATES[cv.parsing_status]
          const ready = cv.parsing_status === 'ready'
          return (
            <AnimatedItem as="li" key={cv.id} className="profile__cv">
              <div className="profile__cv-head">
                <h3>{cv.display_name}</h3>
                {cv.is_current ? (
                  <span className="profile__badge profile__badge--active">
                    Current
                  </span>
                ) : null}
                {/*
                  A badge only while the reading is unfinished or has failed.
                  "Ready" said nothing the two buttons below it did not already
                  say, and every CV in the list carried it.
                */}
                {ready ? null : (
                  <span className={`profile__badge profile__badge--${state.tone}`}>
                    {t(state.label)}
                  </span>
                )}
                <span className="profile__cv-meta">
                  {t('cvs.uploadedWhen', { when: relativeTime(cv.uploaded, t) })}
                  {cv.detected_language
                    ? t('cvs.writtenIn', { language: cv.detected_language })
                    : ''}
                </span>
              </div>

              {/* Same for the sentence: it is news while a CV is waiting,
                  being read or broken, and noise once it is read. */}
              {ready ? null : (
                <p className="profile__cv-state">{t(state.sentence)}</p>
              )}

              {cv.parsing_error ? (
                <p className="profile__cv-error">
                  <Icon name="error" size={18} />
                  <span>
                    <strong>{t('cvs.whyNot')}</strong>
                    <br />
                    {t(cv.parsing_error as StringKey)}
                  </span>
                </p>
              ) : null}

              <div className="profile__cv-actions">
                {ready && !cv.is_current ? (
                  <Button
                    variant="outlined"
                    small
                    icon="star"
                    onClick={() => setMakingCurrent(cv)}
                  >
                    {t('cvs.makeCurrent')}
                  </Button>
                ) : null}
                {ready ? (
                  <Button
                    variant="outlined"
                    small
                    icon="auto_awesome"
                    onClick={() => onAskUpdate(cv)}
                  >
                    {t('cvs.updateFrom')}
                  </Button>
                ) : null}
                <Button variant="outlined" small icon="download">
                  {t('common.download')}
                </Button>
                {/*
                  No Delete on the current CV at all. It was disabled before,
                  with a sentence beside it explaining why — a button you
                  cannot press and a line saying so are two things doing the
                  job of nothing. Make another CV current and this one gets
                  its Delete back.
                */}
                {cv.is_current ? null : (
                  <Button
                    variant="danger"
                    small
                    icon="delete"
                    onClick={() => setDeleting(cv)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </AnimatedItem>
          )
        })}
      </AnimatedList>

      <Dialog
        open={makingCurrent !== null}
        onClose={() => setMakingCurrent(null)}
        headline={t('cvs.makeCurrentHeadline')}
        icon="star"
        actions={
          <>
            <Button variant="text" onClick={() => setMakingCurrent(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="filled"
              onClick={() => {
                onChange(
                  cvs.map((cv) => ({
                    ...cv,
                    is_current: cv.id === makingCurrent?.id,
                  })),
                )
                setMakingCurrent(null)
              }}
            >
              Make it current
            </Button>
          </>
        }
      >
        <p>
          <strong>{makingCurrent?.display_name}</strong> goes out with every new
          application, and it is what recruiters find you by. Applications
          already sent keep the CV they went out with.
        </p>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => onChange(cvs.filter((cv) => cv.id !== deleting?.id))}
        headline={t('cvs.deleteHeadline')}
        description={`${deleting?.display_name ?? ''} is removed for good. Applications you already sent keep the CV they went out with.`}
        confirmLabel={t('common.delete')}
        danger
      />
    </>
  )
}
