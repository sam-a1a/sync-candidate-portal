/**
 * Profile shapes, mirroring the schema in
 * sync-hub-v2/apps/candidate-portal/src/features/profile/schemas/profile.ts.
 *
 * Field names are kept identical so wiring this to the real API later is a
 * matter of swapping the seed for a query, not renaming anything.
 */

import type { IconName } from '../../components/Icon'
import type { StringKey } from '../../i18n/strings'
import type { Relative } from '../../i18n/time'
import type { Translate } from '../../i18n/useT'

export type Proficiency =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'fluent'
  | 'native'

export const PROFICIENCIES: readonly { value: Proficiency; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native' },
]

export type ParsingStatus = 'uploaded' | 'processing' | 'ready' | 'failed'

export interface ParseState {
  /** String keys; the words are looked up where the card is drawn. */
  label: StringKey
  sentence: StringKey
  tone: 'waiting' | 'active' | 'ended'
}

export const PARSE_STATES: Record<ParsingStatus, ParseState> = {
  uploaded: { label: 'cvs.queued', tone: 'waiting', sentence: 'cvs.queuedSentence' },
  processing: {
    label: 'cvs.processing',
    tone: 'waiting',
    sentence: 'cvs.processingSentence',
  },
  ready: { label: 'cvs.ready', tone: 'active', sentence: 'cvs.readySentence' },
  failed: { label: 'cvs.failed', tone: 'ended', sentence: 'cvs.failedSentence' },
}

export const MAX_CVS = 5
export const MAX_ENTRIES = 50
export const CV_FORMATS = 'PDF, DOC or DOCX'
export const MAX_CV_MB = 10

export interface Cv {
  id: string
  display_name: string
  parsing_status: ParsingStatus
  parsing_error: string | null
  detected_language: string | null
  is_current: boolean
  uploaded: Relative
}

export interface Experience {
  id: string
  job_title: string
  company_name: string
  start_month: string
  start_year: string
  end_month: string
  end_year: string
  is_current: boolean
  description: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field_of_study: string
  graduation_year: string
  description: string
}

export interface Project {
  id: string
  name: string
  description: string
  project_url: string
  repository_url: string
  start_year: string
  end_year: string
}

export interface Language {
  id: string
  code: string
  name: string
  proficiency: Proficiency
  /**
   * The Circle Flags name under flags/language/. Usually the language code,
   * but English is deliberately `en-us` rather than `en` — upstream `en`
   * symlinks to the UK flag.
   */
  flag: string
}

/**
 * Dialling codes, each with the country flag that belongs to it. Unlike a
 * language, a dialling code IS a country, so the country flag is correct here.
 */
export const DIAL_CODES = [
  { value: '+961', country: 'lb', label: 'Lebanon' },
  { value: '+962', country: 'jo', label: 'Jordan' },
  { value: '+963', country: 'sy', label: 'Syria' },
  { value: '+964', country: 'iq', label: 'Iraq' },
  { value: '+20', country: 'eg', label: 'Egypt' },
  { value: '+970', country: 'ps', label: 'Palestine' },
  { value: '+90', country: 'tr', label: 'Türkiye' },
] as const

export interface Profile {
  full_name: string
  phone: string
  phone_country: string
  headline: string
  summary: string
  location_key: string
  canonical_role_key: string
  is_searchable: boolean
  linkedin_url: string
  github_url: string
  portfolio_url: string
  experiences: Experience[]
  educations: Education[]
  skills: string[]
  unmapped_skills: string[]
  languages: Language[]
  projects: Project[]
}

/* `label` is a string key on both of these: the words are the view's. */
export const LOCATIONS: { value: string; label: StringKey }[] = [
  { value: '', label: 'loc.none' },
  { value: 'lb-beirut', label: 'loc.lb-beirut' },
  { value: 'jo-amman', label: 'loc.jo-amman' },
  { value: 'sy-damascus', label: 'loc.sy-damascus' },
  { value: 'iq-erbil', label: 'loc.iq-erbil' },
]

export const ROLES: { value: string; label: StringKey }[] = [
  { value: '', label: 'role.none' },
  { value: 'programme-manager', label: 'role.programme-manager' },
  { value: 'field-coordinator', label: 'role.field-coordinator' },
  { value: 'meal-officer', label: 'role.meal-officer' },
  { value: 'logistics-officer', label: 'role.logistics-officer' },
]

export const SEED_PROFILE: Profile = {
  full_name: 'Amina Haddad',
  phone: '71 402 118',
  phone_country: '+961',
  headline: 'Field coordinator, 6 years',
  summary:
    'Six years coordinating field operations across Lebanon and Jordan, mostly in shelter and WASH. Looking for a programme management role with an INGO.',
  location_key: 'lb-beirut',
  canonical_role_key: '',
  is_searchable: false,
  linkedin_url: 'linkedin.com/in/amina-haddad',
  github_url: '',
  portfolio_url: '',
  experiences: [
    {
      id: 'e1',
      job_title: 'Field Coordinator',
      company_name: 'Norwegian Refugee Council',
      start_month: '3',
      start_year: '2021',
      end_month: '',
      end_year: '',
      is_current: true,
      description:
        'Ran distributions across three governorates, managed a team of 11, and reported to donors monthly.',
    },
    {
      id: 'e2',
      job_title: 'Programme Officer',
      company_name: 'Save the Children',
      start_month: '6',
      start_year: '2018',
      end_month: '2',
      end_year: '2021',
      is_current: false,
      description: 'Managed shelter programming for 4,000 households.',
    },
    {
      id: 'e3',
      job_title: 'Logistics Assistant',
      company_name: 'Lebanese Red Cross',
      start_month: '9',
      start_year: '2016',
      end_month: '5',
      end_year: '2018',
      is_current: false,
      description: '',
    },
  ],
  educations: [
    {
      id: 'd1',
      institution: 'American University of Beirut',
      degree: 'BA',
      field_of_study: 'Political Science',
      graduation_year: '2018',
      description: '',
    },
  ],
  skills: [
    'Project management',
    'Humanitarian logistics',
    'Monitoring & evaluation',
    'Stakeholder engagement',
  ],
  // Deliberately mixed: Python/QGIS/Power BI have Simple Icons marks, KoBo
  // Toolbox and Sphere Standards do not. Nothing is reserved for the ones
  // without, so the row stays even.
  unmapped_skills: [
    'KoBo Toolbox',
    'Sphere Standards',
    'Python',
    'QGIS',
    'Power BI',
  ],
  languages: [
    { id: 'l1', code: 'ar', name: 'Arabic', proficiency: 'native', flag: 'ar' },
    { id: 'l2', code: 'en', name: 'English', proficiency: 'fluent', flag: 'en-us' },
    { id: 'l3', code: 'fr', name: 'French', proficiency: 'intermediate', flag: 'fr' },
  ],
  projects: [],
}

export const SEED_CVS: Cv[] = [
  {
    id: 'c1',
    display_name: 'Amina-Haddad-2026.pdf',
    parsing_status: 'ready',
    parsing_error: null,
    detected_language: 'English',
    is_current: true,
    uploaded: { unit: 'day', value: 3 },
  },
  {
    id: 'c2',
    display_name: 'CV-francais-2024.docx',
    parsing_status: 'failed',
    parsing_error: 'cvs.parseScan',
    detected_language: null,
    is_current: false,
    uploaded: { unit: 'month', value: 2 },
  },
]

/** Total experience, counting overlapping jobs once. */
export function totalExperienceYears(profile: Profile): number {
  const spans = profile.experiences
    .map((job) => {
      const start = Number(job.start_year)
      if (!start) return null
      const end = job.is_current
        ? new Date().getFullYear()
        : Number(job.end_year) || start
      return [start, Math.max(start, end)] as const
    })
    .filter((s): s is readonly [number, number] => s !== null)
    .sort((a, b) => a[0] - b[0])

  let total = 0
  let cursor = -Infinity
  for (const [start, end] of spans) {
    const from = Math.max(start, cursor)
    if (end > from) {
      total += end - from
      cursor = end
    }
  }
  return total
}

/** The nine things a profile needs before it can apply. */
export const REQUIREMENTS = [
  'cv',
  'full_name',
  'phone',
  'headline',
  'location',
  'canonical_role',
  'summary',
  'education',
  'language',
] as const

export type Requirement = (typeof REQUIREMENTS)[number]

export const REQUIREMENT_LABELS: Record<Requirement, StringKey> = {
  cv: 'need.cv',
  full_name: 'need.full_name',
  phone: 'need.phone',
  headline: 'need.headline',
  location: 'need.location',
  canonical_role: 'need.canonical_role',
  summary: 'need.summary',
  education: 'need.education',
  language: 'need.language',
}

/** Which tab each requirement is answered on, for the "What's left" menu. */
export const REQUIREMENT_TABS: Record<Requirement, string> = {
  cv: 'cvs',
  full_name: 'about',
  phone: 'about',
  headline: 'about',
  location: 'about',
  canonical_role: 'about',
  summary: 'about',
  education: 'education',
  language: 'languages',
}

const said = (value: string) => value.trim() !== ''

export function missingRequirements(
  profile: Profile,
  cvs: Cv[],
): Requirement[] {
  const met: Record<Requirement, boolean> = {
    cv: cvs.some((cv) => cv.parsing_status === 'ready'),
    full_name: said(profile.full_name),
    phone: said(profile.phone) && said(profile.phone_country),
    headline: said(profile.headline),
    location: said(profile.location_key),
    canonical_role: said(profile.canonical_role_key),
    summary: said(profile.summary),
    education: profile.educations.length > 0,
    language: profile.languages.length > 0,
  }
  return REQUIREMENTS.filter((requirement) => !met[requirement])
}

/* ------------------------- What a CV says about you ----------------------- *
 *
 * The profile draft the reader produces from a CV, keyed by CV id — the
 * sandbox's stand-in for GET /v1/candidates/me/cvs/{id}/profile-draft. Only a
 * CV that was read in full has one.
 *
 * The repo replaces whole sections rather than merging field by field, so a
 * draft carries every section it found and `location_key` / `is_searchable`
 * are deliberately absent: those are yours, not the file's.
 * ------------------------------------------------------------------------ */

export type CvDraft = Omit<Partial<Profile>, 'location_key' | 'is_searchable'>

export const CV_DRAFTS: Record<string, CvDraft> = {
  c1: {
    full_name: 'Amina Haddad',
    phone: '71 402 118',
    phone_country: '+961',
    headline: 'Field coordinator — shelter and WASH, 6 years',
    summary:
      'Six years coordinating field operations across Lebanon and Jordan, mostly in shelter and WASH. Led an area office of eleven and held the budget for three governorates.',
    linkedin_url: 'linkedin.com/in/amina-haddad',
    experiences: [
      {
        id: 'e1',
        job_title: 'Field Coordinator',
        company_name: 'Norwegian Refugee Council',
        start_month: '3',
        start_year: '2021',
        end_month: '',
        end_year: '',
        is_current: true,
        description:
          'Ran distributions across three governorates, managed a team of 11, and reported to donors monthly.',
      },
      {
        id: 'e2',
        job_title: 'Programme Officer',
        company_name: 'Save the Children',
        start_month: '6',
        start_year: '2018',
        end_month: '2',
        end_year: '2021',
        is_current: false,
        description: 'Managed shelter programming for 4,000 households.',
      },
      {
        id: 'e3',
        job_title: 'Logistics Assistant',
        company_name: 'Lebanese Red Cross',
        start_month: '9',
        start_year: '2016',
        end_month: '5',
        end_year: '2018',
        is_current: false,
        description: 'Kept the warehouse and the fleet for the Beirut branch.',
      },
    ],
    educations: [
      {
        id: 'd1',
        institution: 'American University of Beirut',
        degree: 'BA',
        field_of_study: 'Political Science',
        graduation_year: '2018',
        description: '',
      },
    ],
    skills: [
      'Project management',
      'Humanitarian logistics',
      'Monitoring & evaluation',
      'Stakeholder engagement',
      'Budget holding',
    ],
    unmapped_skills: [
      'KoBo Toolbox',
      'Sphere Standards',
      'Python',
      'QGIS',
      'Power BI',
    ],
    languages: [
      { id: 'l1', code: 'ar', name: 'Arabic', proficiency: 'native', flag: 'ar' },
      { id: 'l2', code: 'en', name: 'English', proficiency: 'fluent', flag: 'en-us' },
      { id: 'l3', code: 'fr', name: 'French', proficiency: 'intermediate', flag: 'fr' },
    ],
  },
}

/** The scalar fields a draft can change, and the tab each is answered on. */
export const DRAFT_FIELDS = [
  'full_name',
  'phone',
  'phone_country',
  'headline',
  'summary',
  'linkedin_url',
  'github_url',
  'portfolio_url',
] as const

export type DraftField = (typeof DRAFT_FIELDS)[number]

/** What each field said before the CV filled it, for the fields it changed. */
export function changedFields(
  before: Profile,
  after: Profile,
): Partial<Record<DraftField, string>> {
  const was: Partial<Record<DraftField, string>> = {}
  for (const field of DRAFT_FIELDS) {
    if (before[field] !== after[field]) was[field] = before[field]
  }
  return was
}

/** How many things the CV put on each tab, for the counts on the tab row. */
export function draftCounts(
  before: Profile,
  after: Profile,
): Record<string, number> {
  const scalars = changedFields(before, after)
  const counts: Record<string, number> = {}

  const about = (['full_name', 'phone', 'phone_country', 'headline', 'summary'] as const)
    .filter((field) => scalars[field] !== undefined).length
  if (about > 0) counts.about = about

  const links = (['linkedin_url', 'github_url', 'portfolio_url'] as const)
    .filter((field) => scalars[field] !== undefined).length
  if (links > 0) counts.projects = links

  const list = <T,>(a: T[], b: T[]) =>
    JSON.stringify(a) === JSON.stringify(b) ? 0 : b.length

  const experience = list(before.experiences, after.experiences)
  if (experience > 0) counts.experience = experience

  const education = list(before.educations, after.educations)
  if (education > 0) counts.education = education

  const skills =
    list(before.skills, after.skills) + list(before.unmapped_skills, after.unmapped_skills)
  if (skills > 0) counts.skills = skills

  const languages = list(before.languages, after.languages)
  if (languages > 0) counts.languages = languages

  return counts
}

/* ------------------------------ Uploading -------------------------------- *
 * The checks the browser makes before a byte is sent, mirroring
 * sync-hub-v2/apps/candidate-portal/src/features/cvs/file-check.ts. The
 * refusals are its sentences.
 * ------------------------------------------------------------------------ */

export const CV_ACCEPT = '.pdf,.doc,.docx'

const MAX_CV_BYTES = MAX_CV_MB * 1024 * 1024

export function rejectionFor(file: File, t: Translate): string | null {
  const named = file.name.toLowerCase()
  const looksRight = ['.pdf', '.doc', '.docx'].some((ext) => named.endsWith(ext))
  if (!looksRight) return t('cvs.wrongType', { formats: CV_FORMATS })
  if (file.size === 0) return t('cvs.empty')
  if (file.size > MAX_CV_BYTES) return t('cvs.tooLarge', { mb: MAX_CV_MB })
  return null
}

/* ------------------------- Watching a CV be read ------------------------- *
 * What the reader pulls out, in the order it lands. The detail lines are read
 * off the draft that CV produced, so the panel says what was actually found
 * rather than a generic "Experience ✓".
 * ------------------------------------------------------------------------ */

export interface ReadSection {
  id: string
  /** A string key; the words are looked up where the panel is drawn. */
  label: StringKey
  icon: IconName
  detail: (draft: CvDraft, t: Translate) => string
}

export const READ_SECTIONS: ReadSection[] = [
  {
    id: 'about',
    label: 'read.about',
    icon: 'person',
    detail: (d) => [d.full_name, d.headline].filter(Boolean).join(' · '),
  },
  {
    id: 'experience',
    label: 'read.experience',
    icon: 'work',
    detail: (d, t) => {
      const roles = d.experiences ?? []
      const earliest = roles[roles.length - 1]
      return [
        t.count('read.roles', roles.length),
        earliest ? t('read.backTo', { year: earliest.start_year }) : null,
      ]
        .filter(Boolean)
        .join('، ')
    },
  },
  {
    id: 'education',
    label: 'read.education',
    icon: 'school',
    detail: (d) => (d.educations ?? []).map((e) => e.institution).join(', '),
  },
  {
    id: 'skills',
    label: 'read.skills',
    icon: 'auto_awesome',
    detail: (d, t) =>
      t('read.found', {
        count: (d.skills ?? []).length + (d.unmapped_skills ?? []).length,
      }),
  },
  {
    id: 'languages',
    label: 'read.languages',
    icon: 'language',
    detail: (d) => (d.languages ?? []).map((l) => l.name).join(', '),
  },
  {
    id: 'links',
    label: 'read.links',
    icon: 'link',
    detail: (d) => d.linkedin_url ?? '',
  },
]
