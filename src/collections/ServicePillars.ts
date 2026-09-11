import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'
import { makeRevalidateOnPublish } from '@/hooks/revalidateOnPublish'

export const ServicePillars: CollectionConfig = {
  slug: 'service-pillars',
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
        description: { de: 'z.B. "graduation-cap", "heart", "scale". Muss ein gültiger Lucide-Icon-Name sein.' },
      },
    },
    {
      name: 'colourToken',
      type: 'text',
      label: { de: 'Farb-Token', ar: 'رمز اللون', en: 'Colour token' },
      admin: {
        description: {
          de: 'CSS-Variablenname aus dem Design-System, z.B. "--color-brand-green". Leer = Standardfarbe.',
        },
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
    afterChange: [makeRevalidateOnPublish('service-pillars')],
  },
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
