import type { Block } from 'payload'

export const RichTextBlock: Block = {
  slug: 'rich-text',
  labels: {
    singular: { de: 'Text', ar: 'نص', en: 'Rich text' },
    plural: { de: 'Texte', ar: 'نصوص', en: 'Rich texts' },
  },
  fields: [
    { name: 'content', type: 'richText', localized: true, required: true, label: { de: 'Inhalt', ar: 'المحتوى', en: 'Content' } },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'default',
      label: { de: 'Breite', ar: 'العرض', en: 'Width' },
      options: [
        { label: { de: 'Standard (Lesebreite)', ar: 'افتراضي (عرض القراءة)', en: 'Default (reading width)' }, value: 'default' },
        { label: { de: 'Breit (volle Spaltenbreite)', ar: 'عريض (كامل عرض العمود)', en: 'Wide (full column)' }, value: 'wide' },
      ],
    },
  ],
}
