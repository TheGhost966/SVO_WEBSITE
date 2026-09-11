import type { GlobalConfig } from 'payload'

export const Bundeslaender: GlobalConfig = {
  slug: 'bundeslaender',
  admin: {
    group: { de: 'Einstellungen', ar: 'الإعدادات', en: 'Settings' },
    description: {
      de: 'Die 9 österreichischen Bundesländer. Nur von Administratoren änderbar. Wird als Referenzliste für Veranstaltungen und Nachrichten verwendet.',
    },
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: { de: 'Bundesländer', ar: 'الولايات', en: 'States' },
      fields: [
        {
          name: 'name',
          type: 'text',
          localized: true,
          required: true,
          label: { de: 'Name', ar: 'الاسم', en: 'Name' },
        },
        {
          name: 'code',
          type: 'text',
          required: true,
          label: { de: 'Kürzel', ar: 'الرمز', en: 'Code' },
          admin: { description: { de: 'z.B. W, NOE, OOE, SBG, T, VBG, STMK, KTN, BGLD' } },
        },
      ],
    },
  ],
  access: {
    read: () => true,
    update: ({ req }) => req.user?.role === 'admin',
  },
}
