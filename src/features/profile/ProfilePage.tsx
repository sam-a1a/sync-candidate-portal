import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { Switch } from '../../components/Field'
import { Icon } from '../../components/Icon'
import { PageTransition } from '../../components/PageTransition'
import { Tabs, type TabDefinition } from '../../components/Tabs'
import { WavyProgress } from '../../components/WavyProgress'
import { useT } from '../../i18n/useT'
import {
  AboutPanel,
  CvsPanel,
  EducationPanel,
  ExperiencePanel,
  LanguagesPanel,
  ProjectsPanel,
  SkillsPanel,
} from './panels'
import type { StringKey } from '../../i18n/strings'
import {
  CV_ACCEPT,
  CV_FORMATS,
  MAX_CVS,
  MAX_CV_MB,
  changedFields,
  draftCounts,
  missingRequirements,
  REQUIREMENTS,
  REQUIREMENT_LABELS,
  REQUIREMENT_TABS,
  type Cv,
  type Profile,
} from './data'

/* `label` is a string key; the words are looked up in the render. */
const TABS: TabDefinition[] = [
  { id: 'cvs', label: 'tab.cvs', icon: 'description' },
  { id: 'about', label: 'tab.about', icon: 'person' },
  { id: 'experience', label: 'tab.experience', icon: 'work' },
  { id: 'education', label: 'tab.education', icon: 'school' },
  { id: 'skills', label: 'tab.skills', icon: 'auto_awesome' },
  { id: 'languages', label: 'tab.languages', icon: 'language' },
  { id: 'projects', label: 'tab.projects', icon: 'link' },
]

export function ProfilePage({
  profile,
  cvs,
  onChange,
  onCvsChange,
  dirty,
  onSave,
  currentCvName,
  onUpload,
  refusal,
  onDismissRefusal,
  justRead,
  onDismissJustRead,
  fromCv,
  onUpdateFromCv,
  onUndoCvUpdate,
  openPanels,
  onPanelToggle,
}: {
  profile: Profile
  cvs: Cv[]
  onChange: (patch: Partial<Profile>) => void
  onCvsChange: (next: Cv[]) => void
  dirty: boolean
  onSave: () => void
  /** The CV that goes out with applications — named in the header. */
  currentCvName: string | null
  onUpload: (file: File) => void
  /** Why the browser would not send the file you chose. */
  refusal: string | null
  onDismissRefusal: () => void
  /** A CV the reader has just finished, which raises the question below. */
  justRead: { id: string; display_name: string } | null
  onDismissJustRead: () => void
  /** A CV that has filled the fields, and what they said before. */
  fromCv: { id: string; name: string; before: Profile } | null
  onUpdateFromCv: (cv: Cv) => void
  onUndoCvUpdate: () => void
  /* Which entry is expanded per tab, held above so it survives a tab change. */
  openPanels: Record<string, string | null>
  onPanelToggle: (tab: string, id: string | null) => void
}) {
  const t = useT()
  const [active, setActive] = useState('about')
  const [showLeft, setShowLeft] = useState(false)
  const [askingFor, setAskingFor] = useState<Cv | null>(null)
  const file = useRef<HTMLInputElement>(null)

  /* The CV that raises the question: one you pressed, or one just read. */
  const asking =
    askingFor ?? (justRead ? cvs.find((cv) => cv.id === justRead.id) ?? null : null)

  const closeAsking = () => {
    setAskingFor(null)
    onDismissJustRead()
  }

  const missing = useMemo(
    () => missingRequirements(profile, cvs),
    [profile, cvs],
  )
  const done = REQUIREMENTS.length - missing.length
  const complete = missing.length === 0
  const slotsLeft = Math.max(MAX_CVS - cvs.length, 0)

  /*
   * A tab is flagged when one of the requirements it answers is unmet. With
   * the checklist behind a menu, this dot is the only always-visible cue for
   * what is missing, so it is derived rather than hardcoded.
   */
  /* What the CV put on each tab, so you can see where it landed. */
  const counts = fromCv ? draftCounts(fromCv.before, profile) : {}
  const was = fromCv ? changedFields(fromCv.before, profile) : {}

  const tabs = TABS.map((tab) => ({
    ...tab,
    label: t(tab.label as StringKey),
    incomplete: missing.some(
      (requirement) => REQUIREMENT_TABS[requirement] === tab.id,
    ),
    badge: counts[tab.id] ? `+${counts[tab.id]}` : undefined,
  }))

  const filled = Object.values(counts).reduce((total, n) => total + n, 0)

  return (
    <div className="profile">
      <header className="profile__header">
        <div className="profile__progress">
          <WavyProgress
            value={done}
            max={REQUIREMENTS.length}
            size={64}
            label={t('profile.done', { done, total: REQUIREMENTS.length })}
          >
            {done}/{REQUIREMENTS.length}
          </WavyProgress>
          <div>
            <h1>{t('profile.title')}</h1>
            {/*
              Which CV you are looking at, on every tab. Normally the one that
              goes out with applications; while a CV is filling the fields, the
              one doing the filling — with the way back out of it.
            */}
            {fromCv ? (
              <p className="profile__source profile__source--from">
                <Icon name="auto_awesome" size={16} />
                {t('profile.filledFrom', { name: fromCv.name, count: filled })}
                <button type="button" onClick={onUndoCvUpdate}>
                  {t('profile.undoAll')}
                </button>
              </p>
            ) : currentCvName ? (
              <p className="profile__source">
                <Icon name="description" size={16} />
                {currentCvName}
              </p>
            ) : null}
            <Button
              variant="text"
              className="profile__whats-left"
              onClick={() => setShowLeft(true)}
            >
              {complete ? t('profile.allDone') : t('profile.whatsLeft')}
              <Icon name="expand_more" size={18} />
            </Button>
          </div>
        </div>

        {/*
          The two things you do to a whole profile, in one place: bring a CV
          in, and put what you changed back. No line announcing that nothing
          has happened — when there is nothing to update there is no button,
          and that says it.
        */}
        <div className="profile__save">
          <Button
            variant="outlined"
            icon="upload_file"
            disabled={slotsLeft === 0}
            title={
              slotsLeft === 0
                ? t('profile.atCap', { max: MAX_CVS })
                : t('profile.formats', { formats: CV_FORMATS, mb: MAX_CV_MB })
            }
            onClick={() => file.current?.click()}
          >
            {t('profile.uploadCv')}
          </Button>
          {/*
            The button is the label: a file input styled as one cannot be an
            M3 button, so the button opens the real input kept beside it.
          */}
          <input
            ref={file}
            type="file"
            accept={CV_ACCEPT}
            className="sr-only"
            aria-label={t('profile.chooseFile')}
            onChange={(event) => {
              const chosen = event.target.files?.[0]
              // Cleared, so choosing the same file twice still fires a change.
              event.target.value = ''
              if (chosen) onUpload(chosen)
            }}
          />

          {/*
            AnimatePresence rather than a bare mount: unmounted on save it
            vanished in a frame, which is the jump. This fades and shrinks out.
          */}
          <AnimatePresence initial={false} mode="popLayout">
            {dirty ? (
              <motion.div
                key="update"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              >
                <Button variant="filled" onClick={onSave}>
                  {t('profile.update')}
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </header>

      <Tabs tabs={tabs} activeId={active} onChange={setActive} />

      <PageTransition transitionKey={active}>
        <div className="profile__panel">
          {active === 'cvs' ? (
            <CvsPanel cvs={cvs} onChange={onCvsChange} onAskUpdate={setAskingFor} />
          ) : null}
          {active === 'about' ? (
            <AboutPanel
              profile={profile}
              onChange={onChange}
              was={was}
              fromCvName={fromCv?.name ?? null}
            />
          ) : null}
          {active === 'experience' ? (
            <ExperiencePanel
              profile={profile}
              onChange={onChange}
              openId={openPanels.experience ?? null}
              onToggle={(id) => onPanelToggle('experience', id)}
            />
          ) : null}
          {active === 'education' ? (
            <EducationPanel
              profile={profile}
              onChange={onChange}
              openId={openPanels.education ?? null}
              onToggle={(id) => onPanelToggle('education', id)}
            />
          ) : null}
          {active === 'skills' ? (
            <SkillsPanel profile={profile} onChange={onChange} />
          ) : null}
          {active === 'languages' ? (
            <LanguagesPanel profile={profile} onChange={onChange} />
          ) : null}
          {active === 'projects' ? (
            <ProjectsPanel
              profile={profile}
              onChange={onChange}
              openId={openPanels.projects ?? null}
              onToggle={(id) => onPanelToggle('projects', id)}
            />
          ) : null}
        </div>
      </PageTransition>

      {/* The nine requirements. Each jumps to wherever it is answered. */}
      <Dialog
        open={showLeft}
        onClose={() => setShowLeft(false)}
        headline={
          complete
            ? t('profile.complete')
            : t('profile.done', { done, total: REQUIREMENTS.length })
        }
        actions={
          <Button variant="text" onClick={() => setShowLeft(false)}>
            {t('common.close')}
          </Button>
        }
      >
        <ol className="profile__checklist">
          {REQUIREMENTS.map((requirement) => {
            const met = !missing.includes(requirement)
            const target = REQUIREMENT_TABS[requirement]
            return (
              <li key={requirement}>
                <button
                  type="button"
                  className={met ? 'is-met' : undefined}
                  onClick={() => {
                    setActive(target)
                    setShowLeft(false)
                  }}
                >
                  <span className="profile__tick" aria-hidden="true">
                    {met ? <Icon name="check" size={14} /> : null}
                  </span>
                  {t(REQUIREMENT_LABELS[requirement])}
                  <span className="profile__tick-state">
                    {met ? t('profile.met') : t('profile.toDo')}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="profile__searchable">
          <div>
            <p className="profile__searchable-title">
              {t('profile.searchableTitle')}
            </p>
            <p className="profile__searchable-help">
              {complete
                ? t('profile.searchableOn')
                : t('profile.searchableOff')}
            </p>
          </div>
          <Switch
            label={t('profile.searchableTitle')}
            checked={profile.is_searchable && complete}
            disabled={!complete}
            onChange={(is_searchable) => onChange({ is_searchable })}
          />
        </div>
      </Dialog>

      <Dialog
        open={asking !== null}
        onClose={closeAsking}
        headline={t('profile.askHeadline')}
        icon="auto_awesome"
        actions={
          <>
            <Button variant="text" onClick={closeAsking}>
              {t('profile.keepWhatIHave')}
            </Button>
            <Button
              variant="filled"
              onClick={() => {
                const cv = asking
                closeAsking()
                if (!cv) return
                /* Land on About, where the first of the marks is. */
                setActive('about')
                onUpdateFromCv(cv)
              }}
            >
              {t('profile.updateFields')}
            </Button>
          </>
        }
      >
        <p>
          {t('profile.weRead')} <strong>{asking?.display_name}</strong>.{' '}
          {t('profile.askBody')}
        </p>
      </Dialog>

      {/* A file the browser would not send, and why — before anything uploads. */}
      <Dialog
        open={refusal !== null}
        onClose={onDismissRefusal}
        headline={t('profile.refusedHeadline')}
        icon="error"
        actions={
          <Button variant="filled" onClick={onDismissRefusal}>
            {t('common.close')}
          </Button>
        }
      >
        <p>{refusal}</p>
      </Dialog>
    </div>
  )
}
