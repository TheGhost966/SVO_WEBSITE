import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import { bundeslandField } from '@/fields/bundeslandField'
import {
  isEditorOrAbove,
  readPublishedOrEditorPlus,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'

export const News: CollectionConfig = {
  slug: 'news',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'reviewStatus', 'publishedAt', 'updatedAt'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/de/nachrichten/${doc.slug}`,
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
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: { de: 'Kurzbeschreibung', ar: 'ملخص', en: 'Excerpt' },
      admin: { description: { de: 'Max. 200 Zeichen. Wird in der Übersicht angezeigt.' } },
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
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: { type: { equals: 'news' } },
      label: { de: 'Kategorie', ar: 'الفئة', en: 'Category' },
    },
    {
      name: 'author',
      type: 'text',
      label: { de: 'Autor', ar: 'المؤلف', en: 'Author' },
      admin: { description: { de: 'Freitext. Phase 2: Verweis auf Benutzerkonto.' } },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: { de: 'Veröffentlichungsdatum', ar: 'تاريخ النشر', en: 'Published date' },
      admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' } },
    },
    bundeslandField,
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: { de: 'Auf Startseite hervorheben', ar: 'إبراز على الصفحة الرئيسية', en: 'Feature on homepage' },
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
    afterChange: [makeRevalidateOnPublish('news')],
    afterDelete: [makeRevalidateOnDelete('news')],
  },
  access: {
    read: readPublishedOrEditorPlus,
    // Version history holds every draft — same audience as unpublished content (QA S6).
    readVersions: isEditorOrAbove,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
