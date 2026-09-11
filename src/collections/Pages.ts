import type { CollectionConfig } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { Hero } from '@/blocks/Hero'
import { RichTextBlock } from '@/blocks/RichText'
import { ImageText } from '@/blocks/ImageText'
import { CardGrid } from '@/blocks/CardGrid'
import { Stats } from '@/blocks/Stats'
import { CTABand } from '@/blocks/CTABand'
import { FAQBlock } from '@/blocks/FAQ'
import { LogoGrid } from '@/blocks/LogoGrid'
import { Timeline } from '@/blocks/Timeline'
import { ContactBlock } from '@/blocks/ContactBlock'

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'slug', 'reviewStatus', 'updatedAt'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/de/${doc.slug}`,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Seitentitel', ar: 'عنوان الصفحة', en: 'Page title' },
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Slug (URL-Pfad)', ar: 'الرابط', en: 'Slug (URL path)' },
      admin: {
        description: {
          de: 'Identifiziert die Seite in der URL. Pro Sprache unterschiedlich möglich.',
        },
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      localized: true,
      label: { de: 'Seiteninhalt (Blöcke)', ar: 'محتوى الصفحة', en: 'Page layout (blocks)' },
      blocks: [Hero, RichTextBlock, ImageText, CardGrid, Stats, CTABand, FAQBlock, LogoGrid, Timeline, ContactBlock],
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
