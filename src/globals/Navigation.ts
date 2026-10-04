import type { GlobalConfig } from 'payload'
import { isAdminOrBoard } from '@/lib/access'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: {
    // Hidden from the admin panel: the public header and footer are written in code
    // (src/components/layout) and do not read this global, so editing it changed nothing.
    // The global and its data stay, in case the menus are wired to it later (DECISIONS.md).
    hidden: true,
    group: { de: 'Einstellungen', ar: 'الإعدادات', en: 'Settings' },
    description: {
      de: 'Header- und Footer-Navigation. Alle Bezeichnungen sind mehrsprachig editierbar.',
    },
  },
  fields: [
    {
      name: 'header',
      type: 'array',
      localized: true,
      label: { de: 'Header-Navigation', ar: 'تنقل الرأس', en: 'Header navigation' },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: { de: 'Bezeichnung', ar: 'التسمية', en: 'Label' },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: { de: 'URL / Pfad', ar: 'الرابط', en: 'URL / path' },
        },
        {
          name: 'children',
          type: 'array',
          label: { de: 'Untermenü', ar: 'القائمة الفرعية', en: 'Sub-menu' },
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'url', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'footer',
      type: 'array',
      localized: true,
      label: { de: 'Footer-Navigation', ar: 'تنقل التذييل', en: 'Footer navigation' },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: { de: 'Bezeichnung', ar: 'التسمية', en: 'Label' },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: { de: 'URL / Pfad', ar: 'الرابط', en: 'URL / path' },
        },
      ],
    },
  ],
  access: {
    read: () => true,
    update: isAdminOrBoard,
  },
}
