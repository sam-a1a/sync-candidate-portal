import type { L } from '../../i18n/useT'

/**
 * The lists the pickers search.
 *
 * Skills and languages come from the platform in the real app — these stand in
 * for those queries, with the same shape, so swapping them for a fetch is a
 * one-line change. Dialling codes are a fixed reference list.
 */

/** Circle Flags names; `flag` is the file under flags/language/. */
export interface LanguageOption {
  code: string
  name: string
  /** The language's own name — searched, so typing "العربية" finds Arabic. */
  endonym: string
  flag: string
}

export const LANGUAGE_CATALOGUE: LanguageOption[] = [
  { code: 'ar', name: 'Arabic', endonym: 'العربية', flag: 'ar' },
  { code: 'en', name: 'English', endonym: 'English', flag: 'en-us' },
  { code: 'fr', name: 'French', endonym: 'Français', flag: 'fr' },
  { code: 'es', name: 'Spanish', endonym: 'Español', flag: 'es' },
  { code: 'de', name: 'German', endonym: 'Deutsch', flag: 'de' },
  { code: 'it', name: 'Italian', endonym: 'Italiano', flag: 'it' },
  { code: 'pt', name: 'Portuguese', endonym: 'Português', flag: 'pt' },
  { code: 'nl', name: 'Dutch', endonym: 'Nederlands', flag: 'nl' },
  { code: 'tr', name: 'Turkish', endonym: 'Türkçe', flag: 'tr' },
  { code: 'ru', name: 'Russian', endonym: 'Русский', flag: 'ru' },
  { code: 'uk', name: 'Ukrainian', endonym: 'Українська', flag: 'uk' },
  { code: 'pl', name: 'Polish', endonym: 'Polski', flag: 'pl' },
  { code: 'ro', name: 'Romanian', endonym: 'Română', flag: 'ro' },
  { code: 'el', name: 'Greek', endonym: 'Ελληνικά', flag: 'el' },
  { code: 'he', name: 'Hebrew', endonym: 'עברית', flag: 'he' },
  { code: 'fa', name: 'Persian', endonym: 'فارسی', flag: 'fa' },
  { code: 'ku', name: 'Kurdish', endonym: 'Kurdî', flag: 'ku' },
  { code: 'ps', name: 'Pashto', endonym: 'پښتو', flag: 'ps' },
  { code: 'ur', name: 'Urdu', endonym: 'اردو', flag: 'ur' },
  { code: 'hi', name: 'Hindi', endonym: 'हिन्दी', flag: 'hi' },
  { code: 'bn', name: 'Bengali', endonym: 'বাংলা', flag: 'bn' },
  { code: 'zh', name: 'Chinese', endonym: '中文', flag: 'zh' },
  { code: 'ja', name: 'Japanese', endonym: '日本語', flag: 'ja' },
  { code: 'ko', name: 'Korean', endonym: '한국어', flag: 'ko' },
  { code: 'sw', name: 'Swahili', endonym: 'Kiswahili', flag: 'sw' },
  { code: 'am', name: 'Amharic', endonym: 'አማርኛ', flag: 'am' },
  { code: 'so', name: 'Somali', endonym: 'Soomaali', flag: 'so' },
  { code: 'ti', name: 'Tigrinya', endonym: 'ትግርኛ', flag: 'ti' },
  { code: 'hy', name: 'Armenian', endonym: 'Հայերեն', flag: 'hy' },
  { code: 'az', name: 'Azerbaijani', endonym: 'Azərbaycanca', flag: 'az' },
]

/**
 * Skills the platform knows. These are what Screening reads, which is why
 * they are picked from a list rather than typed — a free-typed "M&E" and a
 * typed "Monitoring and Evaluation" are the same skill to a human and two
 * different strings to a matcher.
 */
/*
 * The platform's list, so it comes in both languages: a skill the candidate
 * picks is the platform's word, not theirs, and Screening reads the id either
 * way. A tool or a standard keeps its own name — brands are not translated.
 */
export const SKILL_CATALOGUE: L[] = [
  { en: 'Project management', ar: 'إدارة المشاريع' },
  { en: 'Programme management', ar: 'إدارة البرامج' },
  { en: 'Humanitarian logistics', ar: 'اللوجستيات الإنسانية' },
  { en: 'Supply chain management', ar: 'إدارة سلسلة الإمداد' },
  { en: 'Monitoring & evaluation', ar: 'الرصد والتقييم' },
  { en: 'Needs assessment', ar: 'تقييم الاحتياجات' },
  { en: 'Stakeholder engagement', ar: 'إشراك أصحاب المصلحة' },
  { en: 'Donor reporting', ar: 'تقارير المانحين' },
  { en: 'Proposal writing', ar: 'كتابة المقترحات' },
  { en: 'Grant management', ar: 'إدارة المنح' },
  { en: 'Budget management', ar: 'إدارة الميزانية' },
  { en: 'Financial reporting', ar: 'التقارير المالية' },
  { en: 'Procurement', ar: 'المشتريات' },
  { en: 'Fleet management', ar: 'إدارة الأسطول' },
  { en: 'Warehouse management', ar: 'إدارة المستودعات' },
  { en: 'Cash & voucher assistance', ar: 'المساعدات النقدية والقسائم' },
  { en: 'Protection mainstreaming', ar: 'تعميم الحماية' },
  { en: 'Child protection', ar: 'حماية الطفل' },
  { en: 'Gender-based violence response', ar: 'الاستجابة للعنف القائم على النوع' },
  { en: 'Shelter & settlements', ar: 'المأوى والمستوطنات' },
  { en: 'WASH', ar: 'المياه والإصحاح' },
  { en: 'Food security & livelihoods', ar: 'الأمن الغذائي وسبل العيش' },
  { en: 'Nutrition', ar: 'التغذية' },
  { en: 'Public health', ar: 'الصحة العامة' },
  { en: 'Emergency response', ar: 'الاستجابة للطوارئ' },
  { en: 'Disaster risk reduction', ar: 'الحد من مخاطر الكوارث' },
  { en: 'Community mobilisation', ar: 'التعبئة المجتمعية' },
  { en: 'Capacity building', ar: 'بناء القدرات' },
  { en: 'Training & facilitation', ar: 'التدريب والتيسير' },
  { en: 'Team leadership', ar: 'قيادة الفريق' },
  { en: 'Staff supervision', ar: 'الإشراف على الموظفين' },
  { en: 'Recruitment', ar: 'التوظيف' },
  { en: 'Conflict resolution', ar: 'حل النزاعات' },
  { en: 'Advocacy', ar: 'المناصرة' },
  { en: 'Policy analysis', ar: 'تحليل السياسات' },
  { en: 'Research & analysis', ar: 'البحث والتحليل' },
  { en: 'Data analysis', ar: 'تحليل البيانات' },
  { en: 'Data collection', ar: 'جمع البيانات' },
  { en: 'GIS mapping', ar: 'رسم الخرائط الجغرافية' },
  { en: 'Translation', ar: 'الترجمة التحريرية' },
  { en: 'Interpretation', ar: 'الترجمة الفورية' },
  { en: 'Report writing', ar: 'كتابة التقارير' },
  { en: 'Communications', ar: 'التواصل' },
  { en: 'Media relations', ar: 'العلاقات الإعلامية' },
  { en: 'Safeguarding', ar: 'الحماية من الاستغلال' },
  { en: 'Security management', ar: 'إدارة الأمن' },
  { en: 'Access negotiation', ar: 'التفاوض على الوصول' },
  { en: 'Partnership management', ar: 'إدارة الشراكات' },
  { en: 'Volunteer coordination', ar: 'تنسيق المتطوعين' },
  { en: 'Case management', ar: 'إدارة الحالة' },
]

/**
 * Tools, software and standards — the "other skills" list.
 *
 * Separate from SKILL_CATALOGUE because these are not what Screening reads;
 * they are what a recruiter scans for. Most carry a brand mark, which is what
 * makes them worth picking from a list rather than typing: "PowerBI",
 * "Power-BI" and "power bi" are one tool to a human and three strings here.
 *
 * Entries with no Simple Icons mark (KoBo Toolbox, ODK, DHIS2, SPSS, Stata)
 * are still listed — the list is about spelling them consistently, not about
 * having a logo.
 */
export const TOOL_CATALOGUE: string[] = [
  'ActivityInfo',
  'Adobe Illustrator',
  'Adobe InDesign',
  'Adobe Photoshop',
  'Airtable',
  'ArcGIS',
  'Asana',
  'Canva',
  'ClickUp',
  'CommCare',
  'Confluence',
  'DHIS2',
  'Docker',
  'Dropbox',
  'Elasticsearch',
  'Figma',
  'GitHub',
  'GitLab',
  'Google Analytics',
  'Google Docs',
  'Google Drive',
  'Google Earth',
  'Google Forms',
  'Google Sheets',
  'Grafana',
  'HubSpot',
  'JavaScript',
  'Jira',
  'Jupyter',
  'KoBo Toolbox',
  'Linux',
  'Looker',
  'Mailchimp',
  'Microsoft Excel',
  'Microsoft Outlook',
  'Microsoft PowerPoint',
  'Microsoft Teams',
  'Microsoft Word',
  'Miro',
  'MongoDB',
  'MySQL',
  'Notion',
  'NumPy',
  'ODK',
  'Odoo',
  'OpenStreetMap',
  'Oracle',
  'Pandas',
  'PHP',
  'PostgreSQL',
  'Power Automate',
  'Power BI',
  'PostGIS',
  'Python',
  'QGIS',
  'QuickBooks',
  'R',
  'React',
  'Redmine',
  'SAP',
  'Salesforce',
  'Slack',
  'Sphere Standards',
  'SPSS',
  'Stata',
  'Stripe',
  'SurveyMonkey',
  'Tableau',
  'TensorFlow',
  'Telegram',
  'Trello',
  'TypeScript',
  'Typeform',
  'WhatsApp',
  'WordPress',
  'Xero',
  'Zapier',
  'Zoom',
]

export interface DialCode {
  code: string
  country: string
  label: string
}

export const DIAL_CODE_CATALOGUE: DialCode[] = [
  { code: '+961', country: 'lb', label: 'Lebanon' },
  { code: '+962', country: 'jo', label: 'Jordan' },
  { code: '+963', country: 'sy', label: 'Syria' },
  { code: '+964', country: 'iq', label: 'Iraq' },
  { code: '+20', country: 'eg', label: 'Egypt' },
  { code: '+970', country: 'ps', label: 'Palestine' },
  { code: '+90', country: 'tr', label: 'Türkiye' },
  { code: '+966', country: 'sa', label: 'Saudi Arabia' },
  { code: '+971', country: 'ae', label: 'United Arab Emirates' },
  { code: '+974', country: 'qa', label: 'Qatar' },
  { code: '+965', country: 'kw', label: 'Kuwait' },
  { code: '+973', country: 'bh', label: 'Bahrain' },
  { code: '+968', country: 'om', label: 'Oman' },
  { code: '+967', country: 'ye', label: 'Yemen' },
  { code: '+218', country: 'ly', label: 'Libya' },
  { code: '+216', country: 'tn', label: 'Tunisia' },
  { code: '+213', country: 'dz', label: 'Algeria' },
  { code: '+212', country: 'ma', label: 'Morocco' },
  { code: '+249', country: 'sd', label: 'Sudan' },
  { code: '+252', country: 'so', label: 'Somalia' },
  { code: '+253', country: 'dj', label: 'Djibouti' },
  { code: '+98', country: 'ir', label: 'Iran' },
  { code: '+93', country: 'af', label: 'Afghanistan' },
  { code: '+92', country: 'pk', label: 'Pakistan' },
  { code: '+91', country: 'in', label: 'India' },
  { code: '+880', country: 'bd', label: 'Bangladesh' },
  { code: '+44', country: 'gb', label: 'United Kingdom' },
  { code: '+1', country: 'us', label: 'United States' },
  { code: '+1', country: 'ca', label: 'Canada' },
  { code: '+33', country: 'fr', label: 'France' },
  { code: '+49', country: 'de', label: 'Germany' },
  { code: '+39', country: 'it', label: 'Italy' },
  { code: '+34', country: 'es', label: 'Spain' },
  { code: '+31', country: 'nl', label: 'Netherlands' },
  { code: '+32', country: 'be', label: 'Belgium' },
  { code: '+46', country: 'se', label: 'Sweden' },
  { code: '+47', country: 'no', label: 'Norway' },
  { code: '+45', country: 'dk', label: 'Denmark' },
  { code: '+41', country: 'ch', label: 'Switzerland' },
  { code: '+43', country: 'at', label: 'Austria' },
  { code: '+30', country: 'gr', label: 'Greece' },
  { code: '+357', country: 'cy', label: 'Cyprus' },
  { code: '+380', country: 'ua', label: 'Ukraine' },
  { code: '+7', country: 'ru', label: 'Russia' },
  { code: '+48', country: 'pl', label: 'Poland' },
  { code: '+40', country: 'ro', label: 'Romania' },
  { code: '+254', country: 'ke', label: 'Kenya' },
  { code: '+251', country: 'et', label: 'Ethiopia' },
  { code: '+234', country: 'ng', label: 'Nigeria' },
  { code: '+27', country: 'za', label: 'South Africa' },
  { code: '+61', country: 'au', label: 'Australia' },
]

/** A skill's name in the language being read, by its platform id. */
export function skillName(id: string, language: 'en' | 'ar'): string {
  const known = SKILL_CATALOGUE.find((skill) => skill.en === id)
  return known ? known[language] : id
}
