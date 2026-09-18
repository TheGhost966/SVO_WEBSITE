/**
 * Single source of truth for the homepage's section identifiers, admin labels, and default
 * order — imported by both `SiteSettings.homeGroup.sectionOrder`'s field config (the `select`
 * options) and the homepage's own rendering logic, so the two can never drift the way a
 * hand-duplicated list would. Same pattern as `src/lib/contactCategories.ts`.
 *
 * Order and membership are BRIEF-AMENDMENT-03 §2.1's ruling: the homepage leads with identity
 * and activity (hero, stats, news, events), then wayfinding content (help cards, roadmaps,
 * guide, experts, jobs), then a closing CTA. §2.2 makes this order board-editable.
 */
export const HOME_SECTIONS = [
  'hero',
  'stats',
  'news',
  'events',
  'helpCards',
  'roadmaps',
  'guide',
  'experts',
  'jobs',
  'ctaBand',
] as const

export type HomeSection = (typeof HOME_SECTIONS)[number]

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
}

export type HomeSectionOrderRow = { section: HomeSection; enabled: boolean }

/** Used whenever `SiteSettings.homeGroup.sectionOrder` is empty — never a blank homepage. */
export const DEFAULT_HOME_SECTION_ORDER: HomeSectionOrderRow[] = HOME_SECTIONS.map((section) => ({
  section,
  enabled: true,
}))
