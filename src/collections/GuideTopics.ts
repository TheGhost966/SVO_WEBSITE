import type { CollectionConfig } from 'payload'
import { isAdminOrBoard } from '@/lib/access'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'

// Fixed reference list, same pattern as ServicePillars — no reviewStatus, always
// public, admin-managed. The public topic grid query
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
      required: true,
      unique: true,
      label: { de: 'Slug (URL)', ar: 'الرابط', en: 'Slug (URL)' },
      admin: {
        description: 'Not localized — one URL segment shared by all languages.',
      },
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
  hooks: {
    afterChange: [makeRevalidateOnPublish('guide-topics')],
    afterDelete: [makeRevalidateOnDelete('guide-topics')],
  },
  // No review workflow here: every change is live at once, on every page that uses it. So this is
  // board and admin work; editors read (they pick from these lists) but do not change them.
  access: {
    read: () => true,
    create: isAdminOrBoard,
    update: isAdminOrBoard,
    delete: isAdminOrBoard,
  },
}
