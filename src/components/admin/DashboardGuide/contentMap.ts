import type { AdminLang } from './copy'

type Trans = Record<AdminLang, string>

export type ContentEntry = {
  /** Payload collection slug — also the admin URL segment. */
  slug: string
  label: Trans
  /** Where on the public site this content shows up, in plain language. */
  where: Trans
  /**
   * `true` when an empty collection visibly leaves a hole on the public site, so it belongs in
   * the setup checklist. Reference data (categories, media) is excluded: useful, but nothing
   * looks broken without it.
   */
  inChecklist: boolean
  /** `false` for collections with no `reviewStatus` field — counting published makes no sense. */
  hasReviewStatus: boolean
}

/**
 * The mapping the board actually needs: collection → the page it fills. Kept next to the guide
 * rather than derived from the collection configs, because "appears on" is a fact about the
 * public routes in `src/i18n/routing.ts` and the homepage section list in `src/lib/homeSections.ts`,
 * which the collection config knows nothing about.
 *
 * Order matches the homepage's own section order (`HOME_SECTIONS`) where applicable, so working
 * top-to-bottom through this list fills the homepage top-to-bottom.
 */
export const CONTENT_MAP: ContentEntry[] = [
  {
    slug: 'roadmaps',
    label: { de: 'Wegweiser', ar: 'خارطات الطريق', en: 'Roadmaps' },
    where: {
      de: 'Startseite (Wegweiser-Bereich + Fortschrittskarte im Hero) und /anleitungen',
      ar: 'الصفحة الرئيسية (قسم خارطات الطريق وبطاقة التقدم في الواجهة) و /roadmaps',
      en: 'Homepage (roadmaps section + the progress card in the hero) and /roadmaps',
    },
    inChecklist: true,
    hasReviewStatus: true,
  },
  {
    slug: 'guide-topics',
    label: { de: 'Guide-Themen', ar: 'مواضيع الدليل', en: 'Guide topics' },
    where: {
      de: 'Startseite (Österreich-Guide-Kacheln) und /oesterreich-guide — nur mit mindestens einem veröffentlichten Artikel',
      ar: 'الصفحة الرئيسية (بطاقات دليل النمسا) و /guide — فقط مع مقال منشور واحد على الأقل',
      en: 'Homepage (Austria Guide tiles) and /guide — only with at least one published article',
    },
    inChecklist: true,
    hasReviewStatus: false,
  },
  {
    slug: 'guide-articles',
    label: { de: 'Guide-Artikel', ar: 'مقالات الدليل', en: 'Guide articles' },
    where: {
      de: 'Die Detailseiten innerhalb eines Guide-Themas',
      ar: 'صفحات التفاصيل داخل موضوع الدليل',
      en: 'The detail pages inside a guide topic',
    },
    inChecklist: true,
    hasReviewStatus: true,
  },
  {
    slug: 'experts',
    label: { de: 'Expert:innen', ar: 'الخبراء', en: 'Experts' },
    where: {
      de: 'Startseite (Expert:innen-Bereich) und /experten',
      ar: 'الصفحة الرئيسية (قسم الخبراء) و /experts',
      en: 'Homepage (experts section) and /experts',
    },
    inChecklist: true,
    hasReviewStatus: true,
  },
  {
    slug: 'events',
    label: { de: 'Veranstaltungen', ar: 'الفعاليات', en: 'Events' },
    where: {
      de: 'Startseite (Veranstaltungen-Bereich) und /veranstaltungen',
      ar: 'الصفحة الرئيسية (قسم الفعاليات) و /events',
      en: 'Homepage (events section) and /events',
    },
    inChecklist: true,
    hasReviewStatus: true,
  },
  {
    slug: 'news',
    label: { de: 'Neuigkeiten', ar: 'الأخبار', en: 'News' },
    where: {
      de: 'Startseite (Neuigkeiten-Bereich) und /nachrichten',
      ar: 'الصفحة الرئيسية (قسم الأخبار) و /news',
      en: 'Homepage (news section) and /news',
    },
    inChecklist: true,
    hasReviewStatus: true,
  },
  {
    slug: 'service-pillars',
    label: { de: 'Leistungs-Schwerpunkte', ar: 'محاور الخدمات', en: 'Service pillars' },
    where: {
      de: 'Die vier Schwerpunkte auf /leistungen',
      ar: 'المحاور الأربعة في /services',
      en: 'The four pillars on /services',
    },
    inChecklist: true,
    hasReviewStatus: false,
  },
  {
    slug: 'services',
    label: { de: 'Leistungen', ar: 'الخدمات', en: 'Services' },
    where: {
      de: 'Die einzelnen Angebote innerhalb eines Schwerpunkts',
      ar: 'العروض الفردية ضمن كل محور',
      en: 'The individual offerings inside a pillar',
    },
    inChecklist: true,
    hasReviewStatus: true,
  },
  {
    slug: 'board-members',
    label: { de: 'Vorstandsmitglieder', ar: 'أعضاء مجلس الإدارة', en: 'Board members' },
    where: { de: '/ueber-uns', ar: '/about', en: '/about' },
    inChecklist: true,
    hasReviewStatus: false,
  },
  {
    slug: 'partners',
    label: { de: 'Partner', ar: 'الشركاء', en: 'Partners' },
    where: { de: '/partner', ar: '/partners', en: '/partners' },
    inChecklist: true,
    hasReviewStatus: false,
  },
  {
    slug: 'categories',
    label: { de: 'Kategorien', ar: 'التصنيفات', en: 'Categories' },
    where: {
      de: 'Die Filter-Leisten auf den Nachrichten- und Veranstaltungsseiten',
      ar: 'أشرطة التصفية في صفحتي الأخبار والفعاليات',
      en: 'The filter bars on the news and events pages',
    },
    inChecklist: false,
    hasReviewStatus: false,
  },
  {
    slug: 'media',
    label: { de: 'Medien', ar: 'الوسائط', en: 'Media' },
    where: {
      de: 'Alle Bilder — hochladen, dann in einem Beitrag auswählen',
      ar: 'جميع الصور — ارفعها ثم اخترها داخل أي مُدخل',
      en: 'All images — upload here, then pick them inside an entry',
    },
    inChecklist: false,
    hasReviewStatus: false,
  },
  {
    slug: 'contact-submissions',
    label: { de: 'Kontaktanfragen', ar: 'رسائل الاتصال', en: 'Contact submissions' },
    where: {
      de: 'Posteingang — was Besucher:innen über das Kontaktformular senden',
      ar: 'صندوق الوارد — ما يرسله الزوّار عبر نموذج الاتصال',
      en: 'Inbox — what visitors send through the contact form',
    },
    inChecklist: false,
    hasReviewStatus: false,
  },
]

export const CHECKLIST = CONTENT_MAP.filter((entry) => entry.inChecklist)
