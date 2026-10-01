import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'

export const BoardMembers: CollectionConfig = {
  slug: 'board-members',
  admin: {
    useAsTitle: 'name',
    group: { de: 'Organisation', ar: 'المنظمة', en: 'Organisation' },
    defaultColumns: ['name', 'role', 'order', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { de: 'Name', ar: 'الاسم', en: 'Name' },
      admin: { description: { de: 'Eigenname — nicht übersetzen.' } },
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Funktion / Titel', ar: 'المنصب', en: 'Role / Title' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Foto', ar: 'الصورة', en: 'Photo' },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: { de: 'Kurzbiografie', ar: 'نبذة مختصرة', en: 'Short biography' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: { de: 'E-Mail (optional)', ar: 'البريد الإلكتروني', en: 'Email (optional)' },
          admin: { width: '50%' },
        },
        {
          name: 'showEmail',
          type: 'checkbox',
          defaultValue: false,
          label: { de: 'E-Mail öffentlich anzeigen', ar: 'إظهار البريد الإلكتروني', en: 'Show email publicly' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'linkedIn',
          type: 'text',
          label: { de: 'LinkedIn-URL', ar: 'رابط LinkedIn', en: 'LinkedIn URL' },
          admin: { width: '50%' },
        },
        {
          name: 'showLinkedIn',
          type: 'checkbox',
          defaultValue: false,
          label: { de: 'LinkedIn öffentlich anzeigen', ar: 'إظهار LinkedIn', en: 'Show LinkedIn publicly' },
          admin: { width: '50%' },
        },
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
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    // Not isLoggedIn: that includes the read-only `viewer` role (QA S5).
    delete: isEditorOrAbove,
  },
}
