/**
 * Single source of truth for the homepage's section identifiers, admin labels, and default
 * order — imported by both `SiteSettings.homeGroup.sectionOrder`'s field config (the `select`
 * options) and the homepage's own rendering logic, so the two can never drift the way a
 * hand-duplicated list would. Same pattern as `src/lib/contactCategories.ts`.
 *
 * Order matches the client's Figma concept (2026-09-21 re-alignment, superseding the original
 * AMENDMENT-03 §2.1 order): hero (with its search bar and stats strip), then wayfinding content
 * in the Figma's own sequence (help cards, roadmaps, guide, experts, jobs, events), then the
 * volunteer/idea CTA band, then news last, then the app band (Figma 10.png) — which announces
 * an app that does not exist yet and so is rendered as a "in Vorbereitung" notice rather than
 * store-download buttons. §2.2 still makes this order board-editable, and the band can be
 * switched off entirely from SiteSettings like any other section.
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
  appBand: { de: 'App-Band (in Vorbereitung)', ar: 'شريط التطبيق (قيد الإعداد)', en: 'App band (in preparation)' },
}

export type HomeSectionOrderRow = { section: HomeSection; enabled: boolean }

/** Used whenever `SiteSettings.homeGroup.sectionOrder` is empty — never a blank homepage. */
export const DEFAULT_HOME_SECTION_ORDER: HomeSectionOrderRow[] = HOME_SECTIONS.map((section) => ({
  section,
  enabled: true,
}))
