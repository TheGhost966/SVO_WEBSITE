import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import { bundeslandField } from '@/fields/bundeslandField'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish } from '@/hooks/revalidateOnPublish'

export const Events: CollectionConfig = {
  slug: 'events',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'startDate', 'reviewStatus', 'updatedAt'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/de/veranstaltungen/${doc.slug}`,
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
      type: 'richText',
      localized: true,
      label: { de: 'Beschreibung', ar: 'الوصف', en: 'Description' },
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
      filterOptions: { type: { equals: 'event' } },
      label: { de: 'Kategorie', ar: 'الفئة', en: 'Category' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          label: { de: 'Beginn', ar: 'البداية', en: 'Start' },
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          label: { de: 'Ende', ar: 'النهاية', en: 'End' },
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd.MM.yyyy HH:mm' },
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'locationName',
      type: 'text',
      localized: true,
      label: { de: 'Veranstaltungsort (Name)', ar: 'اسم المكان', en: 'Venue name' },
    },
    {
      name: 'address',
      type: 'text',
      label: { de: 'Adresse', ar: 'العنوان', en: 'Address' },
    },
    bundeslandField,
    {
      name: 'isOnline',
      type: 'checkbox',
      defaultValue: false,
      label: { de: 'Online-Veranstaltung', ar: 'فعالية عبر الإنترنت', en: 'Online event' },
    },
    {
      name: 'registrationUrl',
      type: 'text',
      label: {
        de: 'Anmeldelink (extern)',
        ar: 'رابط التسجيل',
        en: 'Registration link (external)',
      },
      admin: { description: { de: 'Phase 1: Nur Link anzeigen. Phase 2: Integriertes Formular.' } },
    },
    {
      name: 'capacity',
      type: 'number',
      label: { de: 'Kapazität (nur Anzeige)', ar: 'الطاقة الاستيعابية', en: 'Capacity (display only)' },
      admin: { description: { de: 'Phase 1: Nur zur Anzeige. Keine echte Reservierungslogik.' } },
    },
    {
      name: 'isFree',
      type: 'checkbox',
      defaultValue: true,
      label: { de: 'Kostenlos', ar: 'مجاني', en: 'Free entry' },
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
    },
    seoGroup,
  ],
  hooks: {
    beforeChange: [enforceReviewStatusAccess, syncPublishStatus, notifyBoardOnReview],
    afterChange: [makeRevalidateOnPublish('events')],
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
