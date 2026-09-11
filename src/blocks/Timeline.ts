import type { Block } from 'payload'

export const Timeline: Block = {
  slug: 'timeline',
  labels: {
    singular: { de: 'Zeitlinie', ar: 'الجدول الزمني', en: 'Timeline' },
    plural: { de: 'Zeitlinien', ar: 'جداول زمنية', en: 'Timelines' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      label: { de: 'Einträge', ar: 'الإدخالات', en: 'Items' },
      fields: [
        { name: 'year', type: 'text', required: true, label: { de: 'Jahr / Zeitraum', ar: 'السنة', en: 'Year / period' } },
        { name: 'title', type: 'text', localized: true, required: true, label: { de: 'Titel', ar: 'العنوان', en: 'Title' } },
        { name: 'description', type: 'textarea', localized: true, label: { de: 'Beschreibung', ar: 'الوصف', en: 'Description' } },
      ],
    },
  ],
}
