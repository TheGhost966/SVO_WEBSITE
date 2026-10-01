import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import {
  isEditorOrAbove,
  readPublishedOrEditorPlus,
  updateUnpublishedOrBoardPlus,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'

export const Services: CollectionConfig = {
  slug: 'services',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'pillar', 'reviewStatus', 'updatedAt'],
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
      name: 'pillar',
      type: 'relationship',
      relationTo: 'service-pillars',
      required: true,
      label: { de: 'Säule / Bereich', ar: 'المجال', en: 'Pillar / Area' },
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      label: { de: 'Kurzbeschreibung (für Karten)', ar: 'ملخص', en: 'Summary (for cards)' },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      label: { de: 'Vollständige Beschreibung', ar: 'الوصف الكامل', en: 'Full description' },
    },
    {
      name: 'icon',
      type: 'text',
      label: { de: 'Icon (Lucide-Name)', ar: 'الأيقونة', en: 'Icon (Lucide name)' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Bild', ar: 'الصورة', en: 'Image' },
    },
    {
      name: 'targetAudience',
      type: 'textarea',
      localized: true,
      label: { de: 'Zielgruppe', ar: 'الفئة المستهدفة', en: 'Target audience' },
    },
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',
      hasMany: true,
      label: { de: 'Verwandte Leistungen', ar: 'خدمات ذات صلة', en: 'Related services' },
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
    afterChange: [makeRevalidateOnPublish('services')],
    afterDelete: [makeRevalidateOnDelete('services')],
  },
  access: {
    read: readPublishedOrEditorPlus,
    // Version history holds every draft — same audience as unpublished content (QA S6).
    readVersions: isEditorOrAbove,
    create: isEditorOrAbove,
    // Editors may not touch published/archived documents (QA S7).
    update: updateUnpublishedOrBoardPlus,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
