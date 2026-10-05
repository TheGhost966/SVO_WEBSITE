/**
 * Single source of truth for the homepage's section identifiers, admin labels, and default
 * order — imported by both `SiteSettings.homeGroup.sectionOrder`'s field config (the `select`
 * options) and the homepage's own rendering logic, so the two can never drift the way a
 * hand-duplicated list would. Same pattern as `src/lib/contactCategories.ts`.
 *
 * Order matches the client's Figma concept (2026-09-21 re-alignment): hero (with its search bar and stats strip), then wayfinding content
 * in the Figma's own sequence (help cards, roadmaps, guide, experts, jobs, events), then the
 * volunteer/idea CTA band, then news last. The order stays board-editable.
 *
 * `appBand` (Figma 10.png, an app that does not exist) is no longer rendered and no longer offered
 * in the admin. The value itself stays in this list because it is part
 * of a database enum and may be stored in an existing section order — removing it would be a
 * schema change. See REMOVED_HOME_SECTIONS.
 */
export const HOME_SECTIONS = [
  'hero',
  'stats',
  'helpCards',
  'roadmaps',
  'guide',
  'experts',
  'jobs',
  'events',
  'ctaBand',
  'news',
  'appBand',
] as const

export type HomeSection = (typeof HOME_SECTIONS)[number]

/** Still valid as stored values, never rendered, not selectable in the admin. */
export const REMOVED_HOME_SECTIONS: readonly HomeSection[] = ['appBand']

export const HOME_SECTION_LABELS: Record<HomeSection, { de: string; ar: string; en: string }> = {
  hero: { de: 'Hero', ar: 'الصورة الرئيسية', en: 'Hero' },
  stats: { de: 'Statistik-Leiste', ar: 'شريط الإحصائيات', en: 'Stats band' },
  news: { de: 'Neuigkeiten', ar: 'الأخبار', en: 'News' },
  events: { de: 'Veranstaltungen', ar: 'الفعاليات', en: 'Events' },
  helpCards: { de: 'Hilfe-Karten', ar: 'بطاقات المساعدة', en: 'Help cards' },
  roadmaps: { de: 'Wegweiser (Roadmaps)', ar: 'خارطات الطريق', en: 'Roadmaps' },
  guide: { de: 'Österreich-Guide', ar: 'دليل النمسا', en: 'Austria Guide' },
  experts: { de: 'Expert:innen', ar: 'الخبراء', en: 'Experts' },
  jobs: { de: 'Stellenangebote', ar: 'فرص العمل', en: 'Jobs' },
  ctaBand: { de: 'CTA-Band', ar: 'شريط الدعوة', en: 'CTA band' },
  appBand: { de: 'App-Band (entfernt)', ar: 'شريط التطبيق (أزيل)', en: 'App band (removed)' },
}

export type HomeSectionOrderRow = { section: HomeSection; enabled: boolean }

/** Used whenever `SiteSettings.homeGroup.sectionOrder` is empty — never a blank homepage. */
export const DEFAULT_HOME_SECTION_ORDER: HomeSectionOrderRow[] = HOME_SECTIONS.filter(
  (section) => !REMOVED_HOME_SECTIONS.includes(section),
).map((section) => ({
  section,
  enabled: true,
}))
