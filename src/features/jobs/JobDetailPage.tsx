import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { SegmentedButton } from '../../components/Field'
import { Flag } from '../../components/Flag'
import { Icon } from '../../components/Icon'
import { PageTransition } from '../../components/PageTransition'
import { Tabs, type TabDefinition } from '../../components/Tabs'
import {
  asksForSomething,
  employmentKey,
  modeKey,
  experienceLabel,
  jobCountry,
  jobMeta,
  jobPlace,
  languageName,
  proficiencyLabel,
  questionShape,
  skillDemand,
  yearsAsked,
  type DescriptionBlock,
  type JobDetail,
  type JobQuestion,
} from './data'
import type { Cv } from '../profile/data'
import { useT, type Translate } from '../../i18n/useT'
import { useTheme } from '../../theme/useTheme'
import { absoluteDate, relativeTime } from '../../i18n/time'

/** The page's own cross-dissolve, so the two match rather than compete. */
const SMOOTH = { duration: 0.4, ease: 'easeInOut' } as const

/**
 * The posting, as draft C with draft B's apply card.
 *
 * Draft C's idea is that applying is the last tab rather than a mode the whole
 * page drops into: pressing Apply moves you to Questions, where the questions
 * are asked once — in the place you answer them — instead of being listed and
 * then asked again inside a form, which is what the repo does today.
 *
 * Draft B's idea is the card on the right: Apply is reachable from every tab,
 * and what will be sent with it (the CV, the profile, the answers) is visible
 * before you press it rather than explained afterwards.
 *
 * Every section, label and sentence comes from job-detail.tsx, apply-cta.tsx
 * and application-form.tsx. Nothing here is a feature they do not have.
 */
export function JobDetailPage({
  job,
  cvs,
  signedIn = true,
  sent,
  onBack,
  onApply,
  onOpenApplications,
}: {
  job: JobDetail
  /** Every CV on the profile; only the ones read in full can be applied with. */
  cvs: Cv[]
  signedIn?: boolean
  /** Already applied. Survives leaving the page and coming back. */
  sent: boolean
  onBack: () => void
  onApply: () => void
  onOpenApplications: () => void
}) {
  const t = useT()
  /* Language names come from Intl, so they need the locale, not the strings. */
  const { language: locale } = useTheme()
  const [active, setActive] = useState('about')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [picking, setPicking] = useState(false)

  /*
   * Which CV this application goes out with. The current one to begin with —
   * the one the profile says goes out — and changeable for this application
   * only, which is what the picker is for.
   */
  const usable = cvs.filter((cv) => cv.parsing_status === 'ready')
  const [chosenId, setChosenId] = useState(
    () => usable.find((cv) => cv.is_current)?.id ?? usable[0]?.id ?? null,
  )
  const chosen = usable.find((cv) => cv.id === chosenId) ?? null
  const cvName = chosen?.display_name ?? null

  const asks = asksForSomething(job)
  const asked = job.questions.length > 0

  /*
   * A tab per section the posting actually has. The repo renders "What this
   * role asks for" only when something is asked and the questions only when
   * there are any; a tab that opens onto an empty heading would be worse than
   * the scroll it replaced.
   */
  const tabs: TabDefinition[] = [
    { id: 'about', label: t('job.about'), icon: 'description' },
    ...(asks
      ? [
          {
            id: 'requirements',
            label: t('job.requirements'),
            icon: 'checklist' as const,
          },
        ]
      : []),
    ...(asked
      ? [{ id: 'questions', label: t('job.questions'), icon: 'help' as const }]
      : []),
  ]

  const answer = (id: string, value: string) => {
    setAnswers((current) => ({ ...current, [id]: value }))
    setErrors((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const submit = () => {
    const missing: Record<string, string> = {}
    for (const question of job.questions) {
      if (!question.is_required) continue
      if (!answers[question.id]?.trim()) {
        // The message the repo's zod schema sets, word for word.
        missing[question.id] = t('job.answerThis')
      }
    }
    setErrors(missing)
    if (Object.keys(missing).length > 0) return
    onApply()
  }

  const country = jobCountry(job)
  const place = jobPlace(job, t)
  const years = yearsAsked(job.experience_years)

  return (
    <article className="job">
      <Button
        variant="text"
        icon="arrow_back"
        className="job__back"
        onClick={onBack}
      >
        {t('job.back')}
      </Button>

      {/*
        Draft B: everything the decision needs is in one band above the tabs —
        who, where, what it asks, when it closes, and Apply. Below the tabs
        there is only ever the thing the tab names, centred, so the eye runs
        left to right once and then straight down.
      */}
      <header className="job__band">
        <span
          className="job__logo"
          style={{ background: job.tenant.tone, color: job.tenant.ink }}
          aria-hidden="true"
        >
          {job.tenant.initials}
        </span>

        <div className="job__ident">
          <h1>{t.say(job.title)}</h1>
          <p className="job__meta">
            {country ? <Flag country={country} size={18} /> : null}
            {jobMeta(job, t)}
          </p>

          {/* The facts that used to sit in a rail with nothing under it. */}
          <ul className="job__facts">
            <li>
              {country ? (
                <Flag country={country} size={16} />
              ) : (
                <Icon name="location_on" size={16} />
              )}
              {[place, t(modeKey(job.work_mode))].filter(Boolean).join(' · ')}
            </li>
            <li>
              <Icon name="business_center" size={16} />
              {[
                t(employmentKey(job.employment_type)),
                years !== null ? t('jobs.years', { years }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </li>
            {job.closes_at ? (
              <li>
                <Icon name="schedule" size={16} />
                {t('job.closesOn', {
                  date: absoluteDate(job.closes_at, locale),
                })}
              </li>
            ) : null}
          </ul>
        </div>

        <div className="job__act">
          {/*
            Apply steps aside on the Questions tab — the form is what it
            opens, and the confirmation is what that tab shows once it is
            sent. Saying either twice on one screen is noise.
          */}
          <AnimatePresence initial={false} mode="popLayout">
            {active !== 'questions' ? (
              <motion.div
                key={sent ? 'sent' : 'apply'}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={SMOOTH}
              >
                {sent ? (
                  <div className="job__sent-card">
                    <Icon name="check" size={20} />
                    <div>
                      <p className="job__sent-title">{t('job.sent')}</p>
                      <p>
                        {t('job.followIt')}{' '}
                        <button type="button" onClick={onOpenApplications}>
                          {t('job.myApplications')}
                        </button>
                        .
                      </p>
                    </div>
                  </div>
                ) : signedIn ? (
                  <Button
                    variant="filled"
                    icon="send"
                    className="job__apply-button"
                    onClick={() => setPicking(true)}
                  >
                    {t('job.apply')}
                  </Button>
                ) : (
                  <div className="job__signed-out">
                    <Button variant="filled" className="job__apply-button">
                      Sign in to apply
                    </Button>
                    <p>
                      New to Sync Hub? <a href="/signup">Create an account</a>.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!sent && signedIn ? (
            <p className="job__sends">
              {[
                cvName ?? t('job.noCv'),
                asked ? t.count('job.questionCount', job.questions.length) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}

          {/* Closes is a chip on the left; this line would only repeat it. */}
          <p className="job__dates">
            {t('job.postedOn', { date: absoluteDate(job.posted_at, locale) })}
          </p>
        </div>
      </header>

      {/* A posting with only a description has nothing to tab between. */}
      {tabs.length > 1 ? (
        <Tabs
          tabs={tabs}
          activeId={active}
          onChange={setActive}
          layoutId="job-tab-pill"
        />
      ) : null}

      <div className="job__body">
        <PageTransition transitionKey={active}>
            {active === 'about' ? (
              <Description blocks={job.description} t={t} />
            ) : null}

            {active === 'requirements' ? (
              <div className="job__asks">
                {years !== null ? (
                  <p className="job__experience">
                    {experienceLabel(years, t)}
                  </p>
                ) : null}
                {job.skills.length > 0 ? (
                  <Criteria label={t('job.skills')}>
                    {job.skills.map((skill) => (
                      <Row
                        key={skill.name.en}
                        term={t.say(skill.name)}
                        detail={skillDemand(skill, t)}
                      />
                    ))}
                  </Criteria>
                ) : null}
                {job.languages.length > 0 ? (
                  <Criteria label={t('job.languages')}>
                    {job.languages.map((language) => (
                      <Row
                        key={language.code}
                        term={languageName(language.code, locale)}
                        detail={proficiencyLabel(language, t)}
                      />
                    ))}
                  </Criteria>
                ) : null}
              </div>
            ) : null}

            {/*
              Submitting swaps the form for the confirmation in place. The
              outer `layout` animates the height difference between the two —
              without it the panel snapped from a tall form to a short message
              the instant the application went — and popLayout takes the
              outgoing form out of flow so the confirmation rises into the
              space rather than waiting below it.
            */}
            {active === 'questions' ? (
              <motion.div layout transition={SMOOTH}>
                <AnimatePresence initial={false} mode="popLayout">
                  {sent ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={SMOOTH}
                    >
                      <Sent t={t} onOpenApplications={onOpenApplications} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={SMOOTH}
                    >
                      <form
                        className="job__form"
                        noValidate
                        onSubmit={(event) => {
                          event.preventDefault()
                          submit()
                        }}
                      >
                        <div className="job__questions">
                          {job.questions.map((question) => (
                            <Question
                              key={question.id}
                              question={question}
                              t={t}
                              value={answers[question.id] ?? ''}
                              error={errors[question.id]}
                              onChange={(value) => answer(question.id, value)}
                            />
                          ))}
                        </div>

                        <div className="job__form-actions">
                          <Button variant="filled" type="submit">
                            {t('job.submit')}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
          ) : null}
        </PageTransition>
      </div>

      {/*
        Apply asks which CV goes with it, before anything else. The current one
        is chosen, so the answer is usually Continue — but an application is
        the moment the choice actually matters, and it was made for you.
      */}
      <Dialog
        open={picking}
        onClose={() => setPicking(false)}
        headline={t('job.whichCv')}
        actions={
          <>
            <Button variant="text" onClick={() => setPicking(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="filled"
              disabled={chosen === null}
              onClick={() => {
                setPicking(false)
                /* Questions to answer: go and answer them. None: that press
                   was the second one, so it goes. */
                if (asked) setActive('questions')
                else onApply()
              }}
            >
              {asked ? t('job.continue') : t('job.send')}
            </Button>
          </>
        }
      >
        <p>
          {usable.length === 0
            ? t('job.noCvRead')
            : t('job.whichCvBody', {
                tenant: t.say(job.tenant.name),
                extra: asked
                  ? t('job.whichCvExtra', { count: job.questions.length })
                  : '',
              })}
        </p>

        <ul className="job__cvs">
          {usable.map((cv) => (
            <li key={cv.id}>
              <button
                type="button"
                className={`job__cv-choice${cv.id === chosenId ? ' job__cv-choice--on' : ''}`}
                aria-pressed={cv.id === chosenId}
                onClick={() => setChosenId(cv.id)}
              >
                <Icon name="description" size={20} />
                <span>
                  <span className="job__cv-name">{cv.display_name}</span>
                  <span className="job__cv-meta">
                    {t('job.cvUploaded', {
                      when: relativeTime(cv.uploaded, t),
                    })}
                    {cv.is_current ? t('job.cvCurrent') : ''}
                  </span>
                </span>
                {cv.id === chosenId ? <Icon name="check" size={20} /> : null}
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
    </article>
  )
}

function Description({
  blocks,
  t,
}: {
  blocks: DescriptionBlock[]
  t: Translate
}) {
  return (
    <div className="job__description">
      {blocks.map((block, index) => {
        if (block.kind === 'h') {
          return <h2 key={index}>{t.say(block.text)}</h2>
        }
        if (block.kind === 'ul') {
          return (
            <ul key={index}>
              {block.items.map((item) => (
                <li key={item.en}>{t.say(item)}</li>
              ))}
            </ul>
          )
        }
        return <p key={index}>{t.say(block.text)}</p>
      })}
    </div>
  )
}

function Criteria({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="job__criteria">
      <h3>{label}</h3>
      <ul aria-label={label}>{children}</ul>
    </div>
  )
}

function Row({ term, detail }: { term: string; detail: string }) {
  return (
    <li>
      <span>{term}</span>
      <span>{detail}</span>
    </li>
  )
}

/**
 * One question. Yes-or-no is a segmented button rather than two radios — the
 * same control the profile uses for a two-way choice — and a short answer is
 * the field's own textarea.
 *
 * "Short answer · Required" is the textarea's placeholder rather than a line
 * above an empty box: it says what the box is for, in the box. A choice has no
 * box to put it in, so there it stays a line. Either way the slot is the error
 * slot too, and it holds its height, so a question that goes invalid does not
 * shove the next one down.
 */
function Question({
  question,
  t,
  value,
  error,
  onChange,
}: {
  question: JobQuestion
  t: Translate
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const id = useId()

  /*
   * A short answer is one of the app's own fields: the QUESTION rides the
   * outline as the floating label, exactly as a label does everywhere in the
   * profile, and "Short answer · Required" is the placeholder inside the box —
   * what the box is for, said in the box. The line under it appears only when
   * the answer is missing.
   */
  if (question.question_type === 'short_text') {
    return (
      <div className={`md-field${error ? ' md-field--error' : ''}`}>
        <label className="md-field__label" htmlFor={id}>
          {t.say(question.question_text)}
        </label>
        <textarea
          id={id}
          className="md-field__control"
          rows={3}
          placeholder={questionShape(question, t)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-help` : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {error ? (
          <p id={`${id}-help`} className="md-field__help">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  /* A choice has no box to hang a label on, so it keeps the question above. */
  return (
    <div className={`job__question${error ? ' job__question--error' : ''}`}>
      <p className="job__question-text" id={id}>
        {t.say(question.question_text)}
      </p>
      <p className="job__question-shape">{error ?? questionShape(question, t)}</p>
      <SegmentedButton
        label={t.say(question.question_text)}
        value={value}
        options={[
          { value: 'yes', label: t('job.yes') },
          { value: 'no', label: t('job.no') },
        ]}
        onChange={onChange}
      />
    </div>
  )
}

function Sent({
  t,
  onOpenApplications,
}: {
  t: Translate
  onOpenApplications: () => void
}) {
  return (
    <div className="job__sent">
      <span className="job__sent-mark" aria-hidden="true">
        <Icon name="check" size={28} />
      </span>
      <h2>{t('job.sent')}</h2>
      <p>
        {t('job.followItLong')}{' '}
        <button type="button" onClick={onOpenApplications}>
          {t('job.myApplications')}
        </button>
        .
      </p>
    </div>
  )
}
