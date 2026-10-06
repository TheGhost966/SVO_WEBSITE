import type { Block } from 'payload'

export const CardGrid: Block = {
  slug: 'card-grid',
  labels: {
    singular: { de: 'Kartenraster', ar: 'شبكة البطاقات', en: 'Card grid' },
    plural: { de: 'Kartenraster', ar: 'شبكات البطاقات', en: 'Card grids' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    { name: 'subheading', type: 'text', localized: true, label: { de: 'Untertitel', ar: 'عنوان فرعي', en: 'Subheading' } },
    {
      name: 'cards',
      type: 'array',
      label: { de: 'Karten', ar: 'البطاقات', en: 'Cards' },
      labels: {
        singular: { de: 'Karte', ar: 'بطاقة', en: 'Card' },
        plural: { de: 'Karten', ar: 'البطاقات', en: 'Cards' },
      },
      fields: [
        { name: 'icon', type: 'text', label: { de: 'Icon (Lucide)', ar: 'أيقونة', en: 'Icon (Lucide)' } },
        { name: 'image', type: 'upload', relationTo: 'media', label: { de: 'Bild', ar: 'الصورة', en: 'Image' } },
        { name: 'heading', type: 'text', localized: true, required: true, label: { de: 'Titel', ar: 'العنوان', en: 'Heading' } },
        { name: 'body', type: 'textarea', localized: true, label: { de: 'Text', ar: 'النص', en: 'Body' } },
        { name: 'url', type: 'text', label: { de: 'Link-URL', ar: 'الرابط', en: 'Link URL' } },
        { name: 'linkLabel', type: 'text', localized: true, label: { de: 'Link-Text', ar: 'نص الرابط', en: 'Link label' } },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      label: { de: 'Spalten (Desktop)', ar: 'الأعمدة', en: 'Columns (desktop)' },
      options: ['2', '3', '4'],
    },
  ],
}
