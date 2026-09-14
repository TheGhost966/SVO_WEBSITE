import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'

// Fixed reference list, same pattern as ServicePillars — no reviewStatus, always
// public, admin-managed. Per BRIEF-AMENDMENT-01 §2.8, the public topic grid query
// filters to topics that actually have a published article (see getGuideTopics
// in src/lib/queries.ts); visiting a topic directly with zero articles still
// works and shows an empty state, matching the Services/ServicePillar pattern.
export const GuideTopics: CollectionConfig = {
  slug: 'guide-topics',
  admin: {
    useAsTitle: 'title',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['title', 'order', 'updatedAt'],
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
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { de: 'Kurzbeschreibung', ar: 'وصف مختصر', en: 'Short description' },
    },
    {
      name: 'icon',
      type: 'text',
      label: { de: 'Icon (Lucide-Name)', ar: 'الأيقونة', en: 'Icon (Lucide name)' },
      admin: {
        description: { de: 'z.B. "briefcase", "home", "heart". Muss ein gültiger Lucide-Icon-Name sein.' },
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 99,
      label: { de: 'Reihenfolge', ar: 'الترتيب', en: 'Display order' },
    },
  ],
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
