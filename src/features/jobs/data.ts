import type { StringKey } from '../../i18n/strings'
import type { Relative } from '../../i18n/time'
import type { L, Translate } from '../../i18n/useT'

/**
 * Job shapes and filters, mirroring
 * sync-hub-v2/apps/candidate-portal/src/features/jobs/{job.ts,filters.ts}.
 *
 * Names are kept identical so swapping the seed for the browse query is a
 * matter of changing where the array comes from.
 */

export type EmploymentType =
  | 'full_time'
  | 'part_time'
  | 'contract'
  | 'temporary'
  | 'internship'
  | 'volunteer'

export type WorkMode = 'onsite' | 'hybrid' | 'remote'

/*
 * Enums name a string KEY, not a word: every label is looked up where it is
 * drawn, in whichever language the rail is set to.
 */
export function employmentKey(type: EmploymentType): StringKey {
  return `type.${type}` as StringKey
}

export function modeKey(mode: WorkMode): StringKey {
  return `mode.${mode}` as StringKey
}

export interface Tenant {
  name: L
  /** Initials stand in for the logo until there is one. */
  initials: string
  tone: string
  ink: string
}

export interface Job {
  id: string
  title: L
  tenant: Tenant
  location_key: string | null
  /** A string key, so the place reads in the language the page does. */
  location_name: StringKey | null
  work_mode: WorkMode
  employment_type: EmploymentType
  experience_years: number | null
  posted: Relative
}

/* ------------------------------------------------------------------------ *
 * The posting itself.
 *
 * `Job` above is the summary the listing is built from — PublicJobSummary in
 * the API. What follows is the rest of PublicJob, which only the posting page
 * asks for: the description, what the role asks for, and the questions the
 * application form will put to you.
 * ------------------------------------------------------------------------ */

export type SkillImportance = 'required' | 'preferred' | 'optional'

export type Proficiency =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'fluent'
  | 'native'

export type QuestionType = 'yes_no' | 'short_text'

export interface JobSkill {
  name: L
  importance: SkillImportance
}

export interface JobLanguage {
  code: string
  minimum_proficiency: Proficiency
}

export interface JobQuestion {
  id: string
  question_text: L
  question_type: QuestionType
  is_required: boolean
}

/**
 * The description is rich text in the API. Here it is the blocks the renderer
 * actually supports, so a paragraph cannot arrive as unparsed markup.
 */
export type DescriptionBlock =
  | { kind: 'p'; text: L }
  | { kind: 'h'; text: L }
  | { kind: 'ul'; items: L[] }

export interface JobDetail extends Job {
  description: DescriptionBlock[]
  skills: JobSkill[]
  languages: JobLanguage[]
  questions: JobQuestion[]
  /** Absolute, as the repo's `absoluteDateTime` renders it. */
  /** ISO, so the page can print it in the language it is being read in. */
  posted_at: string
  closes_at: string | null
}

/*
 * These turn data into a sentence, so they take the translator: the words are
 * the view's, the shape of the sentence is the model's.
 */
export function skillDemand(skill: JobSkill, t: Translate): string {
  return t(`job.${skill.importance}` as StringKey)
}

export function proficiencyLabel(language: JobLanguage, t: Translate): string {
  const level = t(`level.${language.minimum_proficiency}` as StringKey)
  return language.minimum_proficiency === 'native'
    ? level
    : t('job.orBetter', { level })
}

/** The language's own name, in the language the page is being read in. */
export function languageName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames(locale, { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

export function questionShape(question: JobQuestion, t: Translate): string {
  return t('job.shape', {
    shape: t(`job.shape.${question.question_type}` as StringKey),
    need: question.is_required ? t('job.required') : t('job.optional'),
  })
}

/** 0 and null both mean "not asked", so neither shows a line. */
export function yearsAsked(years: number | null | undefined): number | null {
  return years !== null && years !== undefined && years > 0 ? years : null
}

export function experienceLabel(years: number, t: Translate): string {
  return t('job.experience', { years })
}

/** Whether the "what it asks for" section has anything in it at all. */
export function asksForSomething(job: JobDetail): boolean {
  return (
    yearsAsked(job.experience_years) !== null ||
    job.skills.length > 0 ||
    job.languages.length > 0
  )
}

/** A remote role with no named place is "Anywhere"; anything else is blank. */
export function jobPlace(
  job: Pick<Job, 'location_name' | 'work_mode'>,
  t: Translate,
): string | null {
  if (job.location_name) return t(job.location_name)
  return job.work_mode === 'remote' ? t('place.anywhere') : null
}

export function jobMeta(job: Job, t: Translate): string {
  return [
    t.say(job.tenant.name),
    jobPlace(job, t),
    t(modeKey(job.work_mode)),
    t(employmentKey(job.employment_type)),
  ]
    .filter(Boolean)
    .join(' · ')
}

export interface JobFilters {
  q?: string
  location?: string
  mode?: WorkMode
  type?: EmploymentType
}

export const NO_FILTERS: JobFilters = {}

export function isFiltered(filters: JobFilters): boolean {
  return Boolean(filters.q || filters.location || filters.mode || filters.type)
}

export function matches(job: Job, filters: JobFilters): boolean {
  if (filters.location && job.location_key !== filters.location) return false
  if (filters.mode && job.work_mode !== filters.mode) return false
  if (filters.type && job.employment_type !== filters.type) return false
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase()
    const haystack = `${job.title} ${job.tenant.name}`.toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  return true
}

/**
 * `country` is the Circle Flags name for the location's country. A remote
 * role has no country and shows no flag — "Anywhere" is not a place with a
 * flag, and picking one would be a lie about where the work is.
 */
export const JOB_LOCATIONS: {
  value: string
  label: StringKey
  country: string
}[] = [
  { value: 'lb-beirut', label: 'loc.lb-beirut', country: 'lb' },
  { value: 'jo-amman', label: 'loc.jo-amman', country: 'jo' },
  { value: 'sy-damascus', label: 'loc.sy-damascus', country: 'sy' },
  { value: 'iq-erbil', label: 'loc.iq-erbil', country: 'iq' },
]

export function jobCountry(job: Pick<Job, 'location_key'>): string | null {
  return JOB_LOCATIONS.find((l) => l.value === job.location_key)?.country ?? null
}

const NRC: Tenant = { name: { en: 'Norwegian Refugee Council', ar: 'المجلس النرويجي للاجئين' }, initials: 'NRC', tone: '#4a3b2a', ink: '#ffd9a0' }
const SC: Tenant = { name: { en: 'Save the Children', ar: 'أنقذوا الأطفال' }, initials: 'SC', tone: '#3a2a3f', ink: '#f0c8ff' }
const IRC: Tenant = { name: { en: 'International Rescue Committee', ar: 'لجنة الإنقاذ الدولية' }, initials: 'IRC', tone: '#2a3a4a', ink: '#bcd9ff' }
const UNHCR: Tenant = { name: { en: 'UNHCR', ar: 'المفوضية السامية للأمم المتحدة لشؤون اللاجئين' }, initials: 'UN', tone: '#1f3a3a', ink: '#9df2ea' }
const MSF: Tenant = { name: { en: 'Médecins Sans Frontières', ar: 'أطباء بلا حدود' }, initials: 'MSF', tone: '#4a2a2a', ink: '#ffb4ab' }
const OXFAM: Tenant = { name: { en: 'Oxfam', ar: 'أوكسفام' }, initials: 'OXF', tone: '#2f3a2a', ink: '#c8e6a0' }

export const SEED_JOBS: Job[] = [
  {
    id: 'j1',
    title: { en: 'Field Coordinator', ar: 'منسّق ميداني' },
    tenant: NRC,
    location_key: 'lb-beirut',
    location_name: 'loc.lb-beirut',
    work_mode: 'onsite',
    employment_type: 'full_time',
    experience_years: 6,
    posted: { unit: 'day', value: 2 },
  },
  {
    id: 'j2',
    title: { en: 'Programme Manager — Shelter', ar: 'مدير برنامج — المأوى' },
    tenant: SC,
    location_key: 'jo-amman',
    location_name: 'loc.jo-amman',
    work_mode: 'hybrid',
    employment_type: 'full_time',
    experience_years: 8,
    posted: { unit: 'day', value: 4 },
  },
  {
    id: 'j3',
    title: { en: 'MEAL Officer', ar: 'مسؤول رصد وتقييم' },
    tenant: IRC,
    location_key: 'iq-erbil',
    location_name: 'loc.iq-erbil',
    work_mode: 'onsite',
    employment_type: 'contract',
    experience_years: 3,
    posted: { unit: 'day', value: 5 },
  },
  {
    id: 'j4',
    title: { en: 'Logistics Assistant', ar: 'مساعد لوجستيات' },
    tenant: UNHCR,
    location_key: null,
    location_name: null,
    work_mode: 'remote',
    employment_type: 'temporary',
    experience_years: null,
    posted: { unit: 'week', value: 1 },
  },
  {
    id: 'j5',
    title: { en: 'WASH Engineer', ar: 'مهندس مياه وإصحاح' },
    tenant: MSF,
    location_key: 'sy-damascus',
    location_name: 'loc.sy-damascus',
    work_mode: 'onsite',
    employment_type: 'full_time',
    experience_years: 4,
    posted: { unit: 'week', value: 1 },
  },
  {
    id: 'j6',
    title: { en: 'Protection Officer', ar: 'مسؤول حماية' },
    tenant: OXFAM,
    location_key: 'lb-beirut',
    location_name: 'loc.lb-beirut',
    work_mode: 'onsite',
    employment_type: 'full_time',
    experience_years: 5,
    posted: { unit: 'week', value: 2 },
  },
  {
    id: 'j7',
    title: { en: 'Cash Assistance Officer', ar: 'مسؤول المساعدات النقدية' },
    tenant: NRC,
    location_key: 'jo-amman',
    location_name: 'loc.jo-amman',
    work_mode: 'onsite',
    employment_type: 'contract',
    experience_years: 3,
    posted: { unit: 'week', value: 2 },
  },
  {
    id: 'j8',
    title: { en: 'Data Analyst — Programmes', ar: 'محلل بيانات — البرامج' },
    tenant: IRC,
    location_key: 'lb-beirut',
    location_name: 'loc.lb-beirut',
    work_mode: 'hybrid',
    employment_type: 'full_time',
    experience_years: 2,
    posted: { unit: 'week', value: 3 },
  },
  {
    id: 'j9',
    title: { en: 'Community Mobiliser', ar: 'منشّط مجتمعي' },
    tenant: OXFAM,
    location_key: 'sy-damascus',
    location_name: 'loc.sy-damascus',
    work_mode: 'onsite',
    employment_type: 'volunteer',
    experience_years: null,
    posted: { unit: 'week', value: 3 },
  },
]

/* ---------------------------- the postings ------------------------------- */

const AR_NATIVE: JobLanguage = { code: 'ar', minimum_proficiency: 'native' }
const AR_ADVANCED: JobLanguage = { code: 'ar', minimum_proficiency: 'advanced' }
const EN_FLUENT: JobLanguage = { code: 'en', minimum_proficiency: 'fluent' }
const EN_ADVANCED: JobLanguage = { code: 'en', minimum_proficiency: 'advanced' }

const PLACES = {
  lebanon: { en: 'Lebanon', ar: 'لبنان' },
  jordan: { en: 'Jordan', ar: 'الأردن' },
  iraq: { en: 'Iraq', ar: 'العراق' },
  syria: { en: 'Syria', ar: 'سوريا' },
}

/** The two questions almost every employer asks, so they are written once. */
function standardQuestions(id: string, place: L): JobQuestion[] {
  return [
    {
      id: `${id}-q1`,
      question_text: {
        en: `Do you have the right to work in ${place.en}?`,
        ar: `هل لديك حق العمل في ${place.ar}؟`,
      },
      question_type: 'yes_no',
      is_required: true,
    },
    {
      id: `${id}-q2`,
      question_text: { en: 'When could you start?', ar: 'متى يمكنك البدء؟' },
      question_type: 'short_text',
      is_required: false,
    },
  ]
}

/**
 * Everything the posting page shows beyond the card. Keyed by job id, so a
 * role with no posting yet returns null rather than an invented one.
 */
const JOB_DETAILS: Record<string, Omit<JobDetail, keyof Job>> = {
  j1: {
    description: [
      { kind: 'p', text: { en: 'NRC is looking for a Field Coordinator to lead the Beirut response team. You will hold the day-to-day running of the area office — staff, budget and the relationship with local authorities — and make the calls that keep people served when access changes.', ar: 'يبحث المجلس النرويجي للاجئين عن منسّق ميداني لقيادة فريق الاستجابة في بيروت. ستتولّى التشغيل اليومي لمكتب المنطقة — الموظفون والميزانية والعلاقة مع السلطات المحلية — وتتخذ القرارات التي تُبقي الخدمة مستمرة عند تغيّر إمكانية الوصول.' } },
      { kind: 'p', text: { en: 'The role reports to the Area Manager and works alongside the Protection, Shelter and WASH leads.', ar: 'ترتبط الوظيفة بمدير المنطقة وتعمل إلى جانب مسؤولي الحماية والمأوى والمياه والإصحاح.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Run the area office and line-manage a team of nine across three sites.', ar: 'إدارة مكتب المنطقة والإشراف المباشر على فريق من تسعة في ثلاثة مواقع.' },
          { en: 'Hold the area budget and sign off spend against the response plan.', ar: 'إدارة ميزانية المنطقة واعتماد الإنفاق وفق خطة الاستجابة.' },
          { en: 'Represent NRC with local authorities, the shelter sector and partner agencies.', ar: 'تمثيل المنظمة أمام السلطات المحلية وقطاع المأوى والوكالات الشريكة.' },
          { en: 'Decide when and where teams move, with the security adviser.', ar: 'تحديد متى وأين تتحرك الفرق، بالتنسيق مع مستشار الأمن.' },
          { en: 'Send the monthly report that goes to the country office and the donor.', ar: 'إرسال التقرير الشهري إلى المكتب القُطري والجهة المانحة.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Humanitarian programme management', ar: 'إدارة البرامج الإنسانية' }, importance: 'required' },
      { name: { en: 'Protection mainstreaming', ar: 'تعميم الحماية' }, importance: 'required' },
      { name: { en: 'Budget holding', ar: 'إدارة الميزانية' }, importance: 'required' },
      { name: { en: 'Reporting in Arabic', ar: 'إعداد التقارير بالعربية' }, importance: 'preferred' },
      { name: { en: 'Kobo Toolbox', ar: 'Kobo Toolbox' }, importance: 'optional' },
    ],
    languages: [AR_NATIVE, EN_FLUENT],
    questions: [
      ...standardQuestions('j1', PLACES.lebanon),
      {
        id: 'j1-q3',
        question_text: { en: 'Tell us about a time you coordinated a response across two agencies.', ar: 'حدّثنا عن مرة نسّقت فيها استجابة بين وكالتين.' },
        question_type: 'short_text',
        is_required: true,
      },
    ],
    posted_at: '2026-09-18',
    closes_at: '2026-10-12',
  },

  j2: {
    description: [
      { kind: 'p', text: { en: 'Save the Children is recruiting a Programme Manager for its shelter portfolio in Jordan. You own the plan, the budget and the reporting for three grants running across Amman and Zaatari.', ar: 'تبحث منظمة أنقذوا الأطفال عن مدير برنامج لمحفظة المأوى في الأردن. ستتولّى الخطة والميزانية والتقارير لثلاث منح تعمل في عمّان والزعتري.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Plan and track delivery against three shelter grants.', ar: 'تخطيط ومتابعة التنفيذ مقابل ثلاث منح للمأوى.' },
          { en: 'Manage four officers and the partners delivering on site.', ar: 'إدارة أربعة مسؤولين والشركاء المنفّذين في الموقع.' },
          { en: 'Write the donor reports and answer the questions that follow them.', ar: 'كتابة تقارير المانحين والإجابة عمّا يتبعها من أسئلة.' },
          { en: 'Keep the safeguarding standards in every contract we sign.', ar: 'الحفاظ على معايير الحماية في كل عقد نوقّعه.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Shelter programming', ar: 'برمجة المأوى' }, importance: 'required' },
      { name: { en: 'Grant management', ar: 'إدارة المنح' }, importance: 'required' },
      { name: { en: 'Partner management', ar: 'إدارة الشركاء' }, importance: 'preferred' },
      { name: { en: 'Safeguarding', ar: 'الحماية من الاستغلال' }, importance: 'required' },
    ],
    languages: [EN_FLUENT, AR_ADVANCED],
    questions: standardQuestions('j2', PLACES.jordan),
    posted_at: '2026-09-16',
    closes_at: '2026-10-03',
  },

  j3: {
    description: [
      { kind: 'p', text: { en: 'The MEAL Officer keeps the evidence behind our programmes in Erbil honest: what was delivered, to whom, and whether it worked. You design the tools, train the teams who use them, and turn what comes back into something the programme can act on.', ar: 'يحافظ مسؤول الرصد والتقييم على صدق الأدلة خلف برامجنا في أربيل: ما الذي سُلّم، ولمن، وهل نجح. تصمّم الأدوات وتدرّب الفرق التي تستخدمها وتحوّل ما يعود منها إلى ما يمكن للبرنامج التصرف بناءً عليه.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Build and maintain the data collection tools for four projects.', ar: 'بناء وصيانة أدوات جمع البيانات لأربعة مشاريع.' },
          { en: 'Run post-distribution monitoring and write up what it found.', ar: 'تنفيذ الرصد بعد التوزيع وكتابة ما توصّل إليه.' },
          { en: 'Keep the complaints and feedback line answered within five days.', ar: 'الرد على خط الشكاوى والملاحظات خلال خمسة أيام.' },
          { en: 'Present findings to the programme team every month.', ar: 'عرض النتائج على فريق البرنامج كل شهر.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Monitoring and evaluation', ar: 'الرصد والتقييم' }, importance: 'required' },
      { name: { en: 'Kobo Toolbox', ar: 'Kobo Toolbox' }, importance: 'required' },
      { name: { en: 'Quantitative analysis', ar: 'التحليل الكمّي' }, importance: 'preferred' },
      { name: { en: 'Power BI', ar: 'Power BI' }, importance: 'optional' },
    ],
    languages: [AR_NATIVE, EN_ADVANCED],
    questions: standardQuestions('j3', PLACES.iraq),
    posted_at: '2026-09-15',
    closes_at: '2026-09-30',
  },

  j4: {
    description: [
      { kind: 'p', text: { en: 'A three-month remote post supporting the supply chain team. You keep the tracker accurate, chase what is late, and prepare the paperwork that moves goods across borders.', ar: 'وظيفة عن بُعد لثلاثة أشهر لدعم فريق سلسلة الإمداد. تحافظ على دقة جدول المتابعة وتتابع المتأخر وتجهّز المستندات التي تنقل البضائع عبر الحدود.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Keep the procurement tracker current and flag what has slipped.', ar: 'تحديث جدول المشتريات والإشارة إلى ما تأخّر.' },
          { en: 'Prepare waybills, customs files and delivery notes.', ar: 'تجهيز بوالص الشحن وملفات الجمارك وإشعارات التسليم.' },
          { en: 'Answer field offices on where their order is.', ar: 'الرد على المكاتب الميدانية بشأن مكان طلباتها.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Supply chain administration', ar: 'إدارة سلسلة الإمداد' }, importance: 'required' },
      { name: { en: 'Excel', ar: 'Excel' }, importance: 'required' },
      { name: { en: 'Customs documentation', ar: 'مستندات الجمارك' }, importance: 'preferred' },
    ],
    languages: [EN_ADVANCED],
    questions: [
      {
        id: 'j4-q1',
        question_text: { en: 'Can you work to a Geneva time zone for part of the day?', ar: 'هل يمكنك العمل بتوقيت جنيف جزءاً من اليوم؟' },
        question_type: 'yes_no',
        is_required: true,
      },
      {
        id: 'j4-q2',
        question_text: { en: 'When could you start?', ar: 'متى يمكنك البدء؟' },
        question_type: 'short_text',
        is_required: false,
      },
    ],
    posted_at: '2026-09-13',
    closes_at: null,
  },

  j5: {
    description: [
      { kind: 'p', text: { en: 'MSF is looking for a WASH Engineer for its Damascus projects. You design and supervise the water and sanitation works in two hospitals and the surrounding neighbourhoods.', ar: 'تبحث أطباء بلا حدود عن مهندس مياه وإصحاح لمشاريعها في دمشق. تصمّم وتشرف على أعمال المياه والصرف في مستشفيين والأحياء المحيطة بهما.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Design water supply and sanitation works, and check them built.', ar: 'تصميم أعمال الإمداد بالمياه والصرف والتحقق من تنفيذها.' },
          { en: 'Supervise contractors on site and sign off the stages they invoice.', ar: 'الإشراف على المقاولين في الموقع واعتماد المراحل التي يطالبون بها.' },
          { en: 'Test water quality and act on what the results say.', ar: 'فحص جودة المياه والتصرف وفق النتائج.' },
          { en: 'Train the hospital teams who will run the systems after we leave.', ar: 'تدريب فرق المستشفى التي ستشغّل الأنظمة بعد رحيلنا.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Water and sanitation engineering', ar: 'هندسة المياه والصرف' }, importance: 'required' },
      { name: { en: 'AutoCAD', ar: 'AutoCAD' }, importance: 'required' },
      { name: { en: 'Contractor supervision', ar: 'الإشراف على المقاولين' }, importance: 'preferred' },
      { name: { en: 'Water quality testing', ar: 'فحص جودة المياه' }, importance: 'preferred' },
    ],
    languages: [AR_NATIVE, EN_ADVANCED],
    questions: standardQuestions('j5', PLACES.syria),
    posted_at: '2026-09-12',
    closes_at: '2026-10-10',
  },

  j6: {
    description: [
      { kind: 'p', text: { en: 'The Protection Officer runs case management for people at risk in Beirut, and makes sure the rest of the programme does not put them at more risk.', ar: 'يدير مسؤول الحماية إدارة الحالة للأشخاص المعرّضين للخطر في بيروت، ويضمن ألا يزيدهم باقي البرنامج خطراً.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Hold a caseload and refer on to legal, health and shelter partners.', ar: 'متابعة عدد من الحالات والإحالة إلى شركاء القانون والصحة والمأوى.' },
          { en: 'Run the protection risk analysis that the area plan is built on.', ar: 'إجراء تحليل مخاطر الحماية الذي تُبنى عليه خطة المنطقة.' },
          { en: 'Train other teams on safe referral and on what not to ask.', ar: 'تدريب الفرق الأخرى على الإحالة الآمنة وعلى ما لا يُسأل.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Case management', ar: 'إدارة الحالة' }, importance: 'required' },
      { name: { en: 'Protection mainstreaming', ar: 'تعميم الحماية' }, importance: 'required' },
      { name: { en: 'Referral pathways', ar: 'مسارات الإحالة' }, importance: 'preferred' },
    ],
    languages: [AR_NATIVE, EN_ADVANCED],
    questions: standardQuestions('j6', PLACES.lebanon),
    posted_at: '2026-09-06',
    closes_at: '2026-09-28',
  },

  j7: {
    description: [
      { kind: 'p', text: { en: 'A six-month contract on the cash programme in Amman. You verify eligibility, run the distributions and answer the households who ask why a payment has not arrived.', ar: 'عقد لستة أشهر في برنامج المساعدات النقدية بعمّان. تتحقق من الأهلية وتنفّذ التوزيعات وتجيب الأسر التي تسأل لماذا لم تصل الدفعة.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Verify eligibility against the selection criteria, and record why.', ar: 'التحقق من الأهلية وفق معايير الاختيار وتسجيل السبب.' },
          { en: 'Run distributions with the financial service provider.', ar: 'تنفيذ التوزيعات مع مزوّد الخدمة المالية.' },
          { en: 'Reconcile each cycle and resolve what did not pay out.', ar: 'تسوية كل دورة ومعالجة ما لم يُصرف.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'Cash and voucher assistance', ar: 'المساعدات النقدية والقسائم' }, importance: 'required' },
      { name: { en: 'Beneficiary data handling', ar: 'التعامل مع بيانات المستفيدين' }, importance: 'required' },
      { name: { en: 'Excel', ar: 'Excel' }, importance: 'preferred' },
    ],
    languages: [AR_NATIVE, EN_ADVANCED],
    questions: standardQuestions('j7', PLACES.jordan),
    posted_at: '2026-09-05',
    closes_at: '2026-09-26',
  },

  j8: {
    description: [
      { kind: 'p', text: { en: 'The programmes team has more data than it can read. This role turns it into the three or four numbers each programme actually steers by, and keeps them trustworthy.', ar: 'لدى فريق البرامج بيانات أكثر مما يمكنه قراءته. تحوّل هذه الوظيفة تلك البيانات إلى الأرقام الثلاثة أو الأربعة التي يسير عليها كل برنامج فعلاً، وتحافظ على موثوقيتها.' } },
      { kind: 'h', text: { en: 'What you will do', ar: 'ماذا ستعمل' } },
      {
        kind: 'ul',
        items: [
          { en: 'Build and maintain the programme dashboards.', ar: 'بناء وصيانة لوحات متابعة البرامج.' },
          { en: 'Clean and join the data coming out of four different tools.', ar: 'تنظيف ودمج البيانات الآتية من أربع أدوات مختلفة.' },
          { en: 'Answer the questions the country office asks before donors do.', ar: 'الإجابة عن أسئلة المكتب القُطري قبل أن يسألها المانحون.' },
        ],
      },
    ],
    skills: [
      { name: { en: 'SQL', ar: 'SQL' }, importance: 'required' },
      { name: { en: 'Power BI', ar: 'Power BI' }, importance: 'required' },
      { name: { en: 'Python', ar: 'Python' }, importance: 'preferred' },
      { name: { en: 'Humanitarian indicators', ar: 'المؤشرات الإنسانية' }, importance: 'optional' },
    ],
    languages: [EN_FLUENT, AR_ADVANCED],
    questions: standardQuestions('j8', PLACES.lebanon),
    posted_at: '2026-08-30',
    closes_at: '2026-09-20',
  },

  j9: {
    description: [
      { kind: 'p', text: { en: 'Volunteers work with their own neighbourhood: telling people what is available, bringing back what is needed, and sitting on the committee that decides where the next distribution goes.', ar: 'يعمل المتطوعون مع حيّهم: يخبرون الناس بما هو متاح، وينقلون ما يُحتاج إليه، ويجلسون في اللجنة التي تقرر أين يذهب التوزيع القادم.' } },
      { kind: 'p', text: { en: 'Two days a week, for three months. Transport and lunch are covered, and the induction is on the first Saturday of each month.', ar: 'يومان في الأسبوع لمدة ثلاثة أشهر. المواصلات والغداء مغطّاة، والتعريف في أول سبت من كل شهر.' } },
    ],
    skills: [],
    languages: [],
    questions: [],
    posted_at: '2026-08-29',
    closes_at: null,
  },

}

export function jobDetail(job: Job): JobDetail | null {
  const detail = JOB_DETAILS[job.id]
  return detail ? { ...job, ...detail } : null
}
