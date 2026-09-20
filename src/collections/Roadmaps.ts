import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'

// Flat collection (no parent topic) — a roadmap is one procedure end-to-end,
// unlike Guide's topic->article nesting. Same content-freshness fields as
// GuideArticles (BRIEF-AMENDMENT-01 §2.6) since this is the same category of
// procedural content (AMS, ÖGK, Meldezettel, Aufenthaltstitel, ...).
export const Roadmaps: CollectionConfig = {
  slug: 'roadmaps',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'reviewStatus', 'lastReviewedAt', 'updatedAt'],
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
      required: true,
      unique: true,
      label: { de: 'Slug (URL)', ar: 'الرابط', en: 'Slug (URL)' },
      admin: {
        description: 'Not localized — one URL segment shared by all languages (see DECISIONS.md "Unlocalized slugs").',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { de: 'Kurzbeschreibung', ar: 'ملخص', en: 'Description' },
    },
    {
      name: 'icon',
      type: 'text',
      label: { de: 'Icon', ar: 'أيقونة', en: 'Icon' },
      admin: { description: 'Lucide icon name, e.g. "file-text". Falls back to an emoji if empty.' },
    },
    // ── Content freshness (BRIEF-AMENDMENT-01 §2.6) — same as GuideArticles ──
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
    // ── Steps (BRIEF-AMENDMENT-01 §3) ───────────────────────────────────────
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      label: { de: 'Schritte', ar: 'الخطوات', en: 'Steps' },
      labels: {
        singular: { de: 'Schritt', ar: 'خطوة', en: 'Step' },
        plural: { de: 'Schritte', ar: 'خطوات', en: 'Steps' },
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
          name: 'description',
          type: 'textarea',
          localized: true,
          required: true,
          label: { de: 'Beschreibung', ar: 'الوصف', en: 'Description' },
        },
        {
          name: 'responsibleAuthority',
          type: 'text',
          localized: true,
          label: { de: 'Zuständige Behörde', ar: 'الجهة المسؤولة', en: 'Responsible authority' },
          admin: { description: 'e.g. AMS, ÖGK, MA 35, Finanzamt, Magistrat' },
        },
        {
          name: 'timing',
          type: 'text',
          localized: true,
          label: { de: 'Frist / Zeitrahmen', ar: 'المهلة الزمنية', en: 'Timing / deadline' },
          admin: { description: 'e.g. "innerhalb von 3 Tagen"' },
        },
        {
          name: 'requiredDocuments',
          type: 'array',
          label: { de: 'Benötigte Unterlagen', ar: 'المستندات المطلوبة', en: 'Required documents' },
          labels: {
            singular: { de: 'Unterlage', ar: 'مستند', en: 'Document' },
            plural: { de: 'Unterlagen', ar: 'مستندات', en: 'Documents' },
          },
          fields: [
            {
              name: 'document',
              type: 'text',
              localized: true,
              required: true,
              label: { de: 'Unterlage', ar: 'مستند', en: 'Document' },
            },
          ],
        },
        {
          name: 'linkedGuideArticle',
          type: 'relationship',
          relationTo: 'guide-articles',
          label: { de: 'Verlinkter Guide-Artikel', ar: 'مقالة الدليل المرتبطة', en: 'Linked guide article' },
          admin: {
            description: 'Links to the specific article, not just the topic, so the user lands on the answer.',
          },
        },
        {
          name: 'links',
          type: 'array',
          label: { de: 'Weiterführende Links', ar: 'روابط إضافية', en: 'Further links' },
          labels: {
            singular: { de: 'Link', ar: 'رابط', en: 'Link' },
            plural: { de: 'Links', ar: 'روابط', en: 'Links' },
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
              label: { de: 'Beschriftung', ar: 'التسمية', en: 'Label' },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              label: { de: 'URL', ar: 'الرابط', en: 'URL' },
            },
          ],
        },
      ],
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
    afterChange: [makeRevalidateOnPublish('roadmaps')],
    afterDelete: [makeRevalidateOnDelete('roadmaps')],
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
