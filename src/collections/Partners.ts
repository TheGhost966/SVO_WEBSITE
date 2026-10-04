import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'

export const Partners: CollectionConfig = {
  slug: 'partners',
  admin: {
    useAsTitle: 'name',
    group: { de: 'Organisation', ar: 'المنظمة', en: 'Organisation' },
    defaultColumns: ['name', 'type', 'order', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { de: 'Name', ar: 'الاسم', en: 'Name' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: { de: 'Logo', ar: 'الشعار', en: 'Logo' },
    },
    {
      name: 'url',
      type: 'text',
      label: { de: 'Website-URL', ar: 'رابط الموقع', en: 'Website URL' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: { de: 'Typ', ar: 'النوع', en: 'Type' },
      options: [
        { label: { de: 'Fördergeber', ar: 'جهة التمويل', en: 'Funder' }, value: 'funder' },
        { label: { de: 'Partner', ar: 'شريك', en: 'Partner' }, value: 'partner' },
        { label: { de: 'Sponsor', ar: 'راعٍ', en: 'Sponsor' }, value: 'sponsor' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 99,
      label: { de: 'Reihenfolge', ar: 'الترتيب', en: 'Display order' },
    },
  ],
  // Shown on cached public pages: without these a change only appeared when the cache expired.
  hooks: {
    afterChange: [makeRevalidateOnPublish('partners')],
    afterDelete: [makeRevalidateOnDelete('partners')],
  },
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
