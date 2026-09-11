import type { Block } from 'payload'

export const Stats: Block = {
  slug: 'stats',
  labels: {
    singular: { de: 'Statistiken', ar: 'الإحصائيات', en: 'Stats' },
    plural: { de: 'Statistik-Blöcke', ar: 'كتل الإحصائيات', en: 'Stats blocks' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    {
      name: 'stats',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      label: { de: 'Kennzahlen', ar: 'الأرقام', en: 'Statistics' },
      fields: [
        { name: 'value', type: 'text', required: true, label: { de: 'Wert (z.B. 1.200+)', ar: 'القيمة', en: 'Value (e.g. 1,200+)' } },
        { name: 'label', type: 'text', localized: true, required: true, label: { de: 'Bezeichnung', ar: 'التسمية', en: 'Label' } },
        { name: 'description', type: 'text', localized: true, label: { de: 'Kurzbeschreibung', ar: 'وصف مختصر', en: 'Short description' } },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'light',
      label: { de: 'Hintergrund', ar: 'الخلفية', en: 'Background' },
      options: [
        { label: { de: 'Hell (Creme)', en: 'Light (cream)' }, value: 'light' },
        { label: { de: 'Marineblau (dunkel)', en: 'Navy (dark)' }, value: 'dark' },
        { label: { de: 'Grün-hell', en: 'Light green' }, value: 'green' },
      ],
    },
  ],
}
