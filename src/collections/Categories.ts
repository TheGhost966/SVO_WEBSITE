import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['name', 'type', 'slug'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Name', ar: 'الاسم', en: 'Name' },
    },
    {
      name: 'slug',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Slug (URL-Segment)', ar: 'رابط مختصر', en: 'Slug (URL segment)' },
      admin: { description: { de: 'Kleinbuchstaben, Bindestriche. Pro Sprache anpassbar.' } },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: { de: 'Verwendung', ar: 'نوع الاستخدام', en: 'Used for' },
      options: [
        { label: { de: 'Nachrichten', ar: 'أخبار', en: 'News' }, value: 'news' },
        { label: { de: 'Veranstaltungen', ar: 'فعاليات', en: 'Events' }, value: 'event' },
        { label: { de: 'Leistungen', ar: 'خدمات', en: 'Services' }, value: 'service' },
      ],
      admin: {
        description: {
          de: 'Hält das Kategoriesystem generisch — Phase 2 kann weitere Typen hinzufügen.',
          en: 'Keeps the category system generic — Phase 2 can add more types.',
        },
      },
    },
  ],
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
