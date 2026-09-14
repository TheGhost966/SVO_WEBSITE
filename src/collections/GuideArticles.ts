import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish } from '@/hooks/revalidateOnPublish'

// No admin.preview (unlike News/Events) — the public URL needs the parent
// topic's slug too (/oesterreich-guide/[topic]/[article]), same two-level
// shape as Services, which also has no preview URL for the same reason.
export const GuideArticles: CollectionConfig = {
  slug: 'guide-articles',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'topic', 'reviewStatus', 'lastReviewedAt', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Titel', ar: 'العنوان', en: 'Title' },
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Slug (URL)', ar: 'الرابط', en: 'Slug (URL)' },
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'guide-topics',
      required: true,
      label: { de: 'Thema', ar: 'الموضوع', en: 'Topic' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: { de: 'Kurzbeschreibung', ar: 'ملخص', en: 'Excerpt' },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      label: { de: 'Inhalt', ar: 'المحتوى', en: 'Content' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Titelbild', ar: 'صورة الغلاف', en: 'Cover image' },
    },
    // ── Content freshness (BRIEF-AMENDMENT-01 §2.6) ─────────────────────────
    // Procedural/legal content about AMS, ÖGK, Meldezettel etc. causes real
    // harm when stale — these three fields make "how current is this" a fact
    // the board can check and sort by, not something left to memory.
    {
      name: 'lastReviewedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: { de: 'Zuletzt geprüft am', ar: 'آخر مراجعة', en: 'Last reviewed on' },
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
        description: { de: 'Wird auf der Seite als "Stand: TT.MM.JJJJ" angezeigt.' },
      },
    },
    {
      name: 'reviewIntervalMonths',
      type: 'number',
      required: true,
      defaultValue: 6,
      label: { de: 'Prüfintervall (Monate)', ar: 'فترة المراجعة (أشهر)', en: 'Review interval (months)' },
      admin: {
        description: {
          de: 'Für die Übersicht "Überfällig zur Prüfung" im Admin-Bereich.',
          en: 'Used by the admin "overdue for review" list.',
        },
      },
    },
    {
      name: 'officialSourceUrl',
      type: 'text',
      label: { de: 'Offizielle Quelle (URL)', ar: 'المصدر الرسمي', en: 'Official source URL' },
      admin: {
        description: {
          de: 'z.B. oesterreich.gv.at, migration.gv.at, ams.at. Wird als Link auf der Seite angezeigt.',
          en: 'e.g. oesterreich.gv.at, migration.gv.at, ams.at. Rendered as a link on the page.',
        },
      },
    },
    // ── Cross-links (BRIEF-AMENDMENT-01 §3) ─────────────────────────────────
    // relatedExperts is added once the Experts collection exists (Slice 3) —
    // a relationship can't target a collection that isn't registered yet.
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      label: { de: 'Verwandte Leistungen', ar: 'خدمات ذات صلة', en: 'Related services' },
    },
    {
      name: 'relatedRoadmaps',
      type: 'relationship',
      relationTo: 'roadmaps',
      hasMany: true,
      label: { de: 'Verwandte Wegweiser', ar: 'خرائط طريق ذات صلة', en: 'Related roadmaps' },
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: { de: 'Status', ar: 'الحالة', en: 'Status' },
      options: [
        { label: { de: 'Entwurf', ar: 'مسودة', en: 'Draft' }, value: 'draft' },
        { label: { de: 'Zur Überprüfung eingereicht', ar: 'قيد المراجعة', en: 'In review' }, value: 'in_review' },
        { label: { de: 'Veröffentlicht', ar: 'منشور', en: 'Published' }, value: 'published' },
        { label: { de: 'Archiviert', ar: 'مؤرشف', en: 'Archived' }, value: 'archived' },
      ],
      admin: {
        description: {
          de: 'Redakteure können nur auf "Zur Überprüfung" setzen. Nur Vorstand/Admin kann veröffentlichen.',
        },
      },
    },
    seoGroup,
  ],
  hooks: {
    beforeChange: [enforceReviewStatusAccess, syncPublishStatus, notifyBoardOnReview],
    afterChange: [makeRevalidateOnPublish('guide-articles')],
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
