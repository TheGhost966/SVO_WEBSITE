import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'

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
      localized: true,
      required: true,
      label: { de: 'Slug (URL)', ar: 'الرابط', en: 'Slug (URL)' },
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
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
