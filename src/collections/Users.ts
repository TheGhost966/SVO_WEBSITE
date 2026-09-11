import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrSelf } from '@/lib/access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: { de: 'System', ar: 'النظام', en: 'System' },
    defaultColumns: ['email', 'name', 'role'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { de: 'Name', ar: 'الاسم', en: 'Name' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      label: { de: 'Rolle', ar: 'الدور', en: 'Role' },
      options: [
        { label: { de: 'Administrator', ar: 'مدير', en: 'Admin' }, value: 'admin' },
        { label: { de: 'Vorstand', ar: 'مجلس الإدارة', en: 'Board' }, value: 'board' },
        { label: { de: 'Redakteur', ar: 'محرر', en: 'Editor' }, value: 'editor' },
        { label: { de: 'Betrachter', ar: 'مشاهد', en: 'Viewer' }, value: 'viewer' },
      ],
      access: {
        // Only admins may change another user's role
        update: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        description: {
          de: 'editor = Entwürfe erstellen, nicht veröffentlichen. board = veröffentlichen. admin = alles.',
          en: 'editor = create drafts, cannot publish. board = may publish. admin = everything.',
        },
      },
    },
  ],
  access: {
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
}
