import { useRef, useState } from 'react'
import { useT } from './i18n/useT'
import type { StringKey } from './i18n/strings'
import { NavRail } from './components/NavRail'
import { PageTransition } from './components/PageTransition'
import { DESTINATIONS, UTILITIES } from './app/navigation'
import { ProfilePage } from './features/profile/ProfilePage'
import { ReadingPanel, type Reading } from './features/profile/ReadingPanel'
import { JobsPage } from './features/jobs/JobsPage'
import { JobDetailPage } from './features/jobs/JobDetailPage'
import { ApplicationsPage } from './features/applications/ApplicationsPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import {
  SEED_NOTIFICATIONS,
  notificationCopy,
  unreadCount,
  type Notification,
} from './features/notifications/data'
import { AccountPanel } from './features/account/AccountPanel'
import { SEED_ACCOUNT, type Account } from './features/account/data'
import {
  CV_DRAFTS,
  READ_SECTIONS,
  REQUIREMENTS,
  rejectionFor,
  SEED_CVS,
  SEED_PROFILE,
  missingRequirements,
  type Cv,
  type Profile,
} from './features/profile/data'
import {
  JOB_LOCATIONS,
  SEED_JOBS,
  jobDetail,
  matches,
  type Job,
} from './features/jobs/data'
import type { Application } from './features/applications/data'

/** Nothing applied for yet — the state draft B was drawn for. */
const SEED_APPLICATIONS: Application[] = []

function App() {
  const t = useT()
  const [active, setActive] = useState('applications')

  /*
   * Held here rather than in ProfilePage so it survives navigating away and
   * back — a page that forgets your unsaved edits the moment you glance at
   * Jobs is worse than one that never had them.
   */
  const [profile, setProfile] = useState<Profile>(SEED_PROFILE)
  const [cvs, setCvs] = useState<Cv[]>(SEED_CVS)
  const [jobs] = useState<Job[]>(SEED_JOBS)
  const [applications, setApplications] =
    useState<Application[]>(SEED_APPLICATIONS)
  const [notifications, setNotifications] =
    useState<Notification[]>(SEED_NOTIFICATIONS)
  const [account, setAccount] = useState<Account>(SEED_ACCOUNT)
  /* The account is a panel, not a page: it opens over whatever you were on. */
  const [accountOpen, setAccountOpen] = useState(false)
  const [dirty, setDirty] = useState(false)

  /*
   * A CV that has filled the fields, and what they said before it did. Held
   * until you press Update or undo it — the repo's rule is that nothing a CV
   * says is saved until you save the profile yourself.
   */
  const [fromCv, setFromCv] = useState<{
    id: string
    name: string
    before: Profile
  } | null>(null)

  /** A file the browser refused, and a CV that has just been read in full. */
  const [refusal, setRefusal] = useState<string | null>(null)

  /*
   * The read, while you watch it (draft B). Closing the panel does not stop
   * it, so the ref says whether it is still on screen when the file lands —
   * open, the panel asks the question; closed, the list does.
   */
  const [reading, setReading] = useState<Reading | null>(null)
  const watching = useRef(false)
  const [justRead, setJustRead] = useState<Pick<Cv, 'id' | 'display_name'> | null>(
    null,
  )

  /*
   * Which posting is open, as an id rather than the job itself: held by id it
   * cannot go stale if the listing behind it changes, and it is what a router
   * would carry in the URL.
   */
  const [openJobId, setOpenJobId] = useState<string | null>(null)

  /*
   * Which entry is expanded, per tab. Up here rather than inside each panel
   * because a panel unmounts when you change tab — held locally, a collapsed
   * entry sprang back open the moment you left and returned.
   */
  const [openPanels, setOpenPanels] = useState<Record<string, string | null>>({
    experience: 'e1',
    education: 'd1',
  })

  const change = (patch: Partial<Profile>) => {
    setProfile((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  /*
   * The empty state's suggestions. Not a recommender: the candidate's own
   * location and the roles they say they want, run through the same filter
   * the jobs list uses. If the profile says nothing yet, it suggests nothing
   * and the empty state falls back to its buttons.
   */
  const suggested = profile.location_key
    ? jobs.filter((job) => matches(job, { location: profile.location_key })).slice(0, 3)
    : []

  const openJob = jobs.find((job) => job.id === openJobId) ?? null
  const posting = openJob ? jobDetail(openJob) : null

  const openPosting = (job: Job) => {
    setOpenJobId(job.id)
    setActive('jobs')
  }

  /** The CV that goes out with an application — the current one. */
  const currentCv = cvs.find((cv) => cv.is_current) ?? null

  /*
   * The rail's badge is the unread count, not a number written into the
   * navigation config — opening one has to take it down.
   */
  const utilities = UTILITIES.map((utility) => ({
    ...utility,
    label: t(utility.label as StringKey),
    badge:
      utility.id === 'notifications' ? unreadCount(notifications) : utility.badge,
  }))

  const destinations = DESTINATIONS.map((destination) => ({
    ...destination,
    label: t(destination.label as StringKey),
  }))

  const profileDone = REQUIREMENTS.length - missingRequirements(profile, cvs).length

  /*
   * Uploading. The file is checked here, the way the browser checks it in the
   * repo, and then the CV walks its states — Queued, Reading, Ready — which is
   * what the list is polling for against the real API. The timers stand in for
   * that poll; everything they set is what the server would have said.
   */
  const uploadCv = (file: File) => {
    const rejected = rejectionFor(file, t)
    if (rejected) {
      setRefusal(rejected)
      return
    }

    const id = `c${Date.now()}`
    setCvs((current) => [
      {
        id,
        display_name: file.name,
        parsing_status: 'uploaded',
        parsing_error: null,
        detected_language: null,
        is_current: false,
        uploaded: { unit: 'now' },
      },
      ...current,
    ])

    const set = (patch: Partial<Cv>) =>
      setCvs((current) =>
        current.map((cv) => (cv.id === id ? { ...cv, ...patch } : cv)),
      )

    setReading({ id, name: file.name, found: [], done: false })
    watching.current = true

    /*
     * Each section lands on its own, because that is how it comes back: the
     * panel shows what has arrived, not a bar guessing at a finish time.
     */
    const land = (section: string) =>
      setReading((current) =>
        current && current.id === id
          ? { ...current, found: [...current.found, section] }
          : current,
      )

    window.setTimeout(() => set({ parsing_status: 'processing' }), 700)
    READ_SECTIONS.forEach((section, index) => {
      window.setTimeout(() => land(section.id), 1100 + index * 650)
    })

    window.setTimeout(() => {
      set({ parsing_status: 'ready', detected_language: 'English' })
      setReading((current) =>
        current && current.id === id ? { ...current, done: true } : current,
      )
      /* Watched it land: the panel asks. Walked away: the list asks. */
      if (!watching.current) setJustRead({ id, display_name: file.name })
    }, 1100 + READ_SECTIONS.length * 650)
  }

  /** Fill the fields from what the reader got out of this CV. */
  const updateFromCv = (cv: Cv) => {
    /*
     * One seeded draft stands in for
     * GET /v1/candidates/me/cvs/{id}/profile-draft, so a file you upload here
     * reads as the seeded one does.
     */
    const draft = CV_DRAFTS[cv.id] ?? CV_DRAFTS.c1
    if (!draft) return
    setFromCv({ id: cv.id, name: cv.display_name, before: profile })
    setProfile((current) => ({ ...current, ...draft }))
    setDirty(true)
  }

  /** Put every field back to what it said before that CV touched it. */
  const undoCvUpdate = () => {
    if (!fromCv) return
    setProfile(fromCv.before)
    setFromCv(null)
    setDirty(false)
  }

  /*
   * The picture is held as an object URL so it shows everywhere at once — the
   * panel and the rail read the same field. The old one is revoked, or every
   * change would leak the last file for the life of the tab.
   */
  const changePicture = (file: File) =>
    setAccount((current) => {
      if (current.avatar_url) URL.revokeObjectURL(current.avatar_url)
      return { ...current, avatar_url: URL.createObjectURL(file) }
    })

  /** Opening a notification marks it read and goes where it points. */
  const openNotification = (notification: Notification) => {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id && item.read_at === null
          ? { ...item, read_at: 'just now' }
          : item,
      ),
    )
    setActive(notificationCopy(notification, t).to)
  }

  const apply = (job: Job) =>
    setApplications((current) => [
      {
        id: `a${current.length + 1}`,
        job,
        stage: 'received',
        applied: { unit: 'now' },
      },
      ...current,
    ])

  const lookingFor = [
    profile.headline.split(',')[0]?.trim(),
    (() => {
      const found = JOB_LOCATIONS.find((l) => l.value === profile.location_key)
      return found ? t(found.label) : undefined
    })(),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="bg-background text-on-surface flex min-h-svh">
      <NavRail
        destinations={destinations}
        utilities={utilities}
        activeId={active}
        /* Pressing Jobs in the rail means the listing, not the posting you
           happened to leave open there. */
        onNavigate={(id) => {
          /* The avatar is not a destination — it opens the account over you. */
          if (id === 'account') {
            setAccountOpen(true)
            return
          }
          if (id === 'jobs') setOpenJobId(null)
          setActive(id)
        }}
        account={{
          id: 'account',
          name: profile.full_name,
          avatarUrl: account.avatar_url ?? undefined,
        }}
      />

      <main className="min-w-0 flex-1 px-10 py-11">
        {/*
          The profile goes through the same cross-fade as everything else. Its
          own tab transitions are keyed separately, so switching a tab does not
          re-fade the whole page.
        */}
        <PageTransition
          transitionKey={posting && active === 'jobs' ? `job:${posting.id}` : active}
        >
          {active === 'jobs' ? (
            posting ? (
              <JobDetailPage
                job={posting}
                cvs={cvs}
                /*
                  Applied already, and not since withdrawn — withdrawing says
                  you can apply again while the role is open, so it has to put
                  the Apply button back.
                */
                sent={applications.some(
                  (application) =>
                    application.job.id === posting.id &&
                    application.stage !== 'withdrawn',
                )}
                onBack={() => setOpenJobId(null)}
                onApply={() => apply(posting)}
                onOpenApplications={() => {
                  setOpenJobId(null)
                  setActive('applications')
                }}
              />
            ) : (
              <JobsPage jobs={jobs} onOpen={openPosting} />
            )
          ) : null}

          {active === 'applications' ? (
            <ApplicationsPage
              applications={applications}
              suggested={suggested}
              lookingFor={lookingFor}
              onWithdraw={(id) =>
                setApplications((current) =>
                  current.map((application) =>
                    application.id === id
                      ? { ...application, stage: 'withdrawn' }
                      : application,
                  ),
                )
              }
              onBrowse={() => {
                setOpenJobId(null)
                setActive('jobs')
              }}
              onOpenJob={openPosting}
            />
          ) : null}

          {active === 'profile' ? (
            <ProfilePage
              profile={profile}
              cvs={cvs}
              onChange={change}
              onCvsChange={setCvs}
              dirty={dirty}
              onSave={() => {
                setDirty(false)
                setFromCv(null)
              }}
              currentCvName={currentCv?.display_name ?? null}
              onUpload={uploadCv}
              refusal={refusal}
              onDismissRefusal={() => setRefusal(null)}
              justRead={justRead}
              onDismissJustRead={() => setJustRead(null)}
              fromCv={fromCv}
              onUpdateFromCv={updateFromCv}
              onUndoCvUpdate={undoCvUpdate}
              openPanels={openPanels}
              onPanelToggle={(tab, id) =>
                setOpenPanels((current) => ({ ...current, [tab]: id }))
              }
            />
          ) : null}

          {active === 'notifications' ? (
            <NotificationsPage
              notifications={notifications}
              onOpen={openNotification}
              onBrowse={() => {
                setOpenJobId(null)
                setActive('jobs')
              }}
            />
          ) : null}
        </PageTransition>
      </main>

      {/* The read, over whatever you were doing. */}
      <ReadingPanel
        reading={reading}
        onClose={() => {
          watching.current = false
          setReading(null)
        }}
        onUpdate={() => {
          const cv = cvs.find((item) => item.id === reading?.id)
          watching.current = false
          setReading(null)
          if (cv) {
            setActive('profile')
            updateFromCv(cv)
          }
        }}
      />

      <AccountPanel
        open={accountOpen}
        account={account}
        name={profile.full_name}
        counts={{
          profileDone,
          profileTotal: REQUIREMENTS.length,
          cvs: cvs.length,
          applications: applications.length,
        }}
        onClose={() => setAccountOpen(false)}
        onPictureChange={changePicture}
        /*
          Nothing to end and nothing to erase in a sandbox with no session —
          both close the panel, and the real handlers go where these are.
        */
        onSignOut={() => setAccountOpen(false)}
        onDelete={() => setAccountOpen(false)}
        onOpen={(page) => {
          setAccountOpen(false)
          setActive(page)
        }}
      />
    </div>
  )
}

export default App
