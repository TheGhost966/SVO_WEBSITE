import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  labels: { singular: { de: 'Hero', ar: 'Hero', en: 'Hero' }, plural: { de: 'Heroes', ar: 'Heroes', en: 'Heroes' } },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    { name: 'subheading', type: 'text', localized: true, label: { de: 'Untertitel', ar: 'عنوان فرعي', en: 'Subheading' } },
    { name: 'body', type: 'textarea', localized: true, label: { de: 'Text', ar: 'النص', en: 'Body text' } },
    { name: 'image', type: 'upload', relationTo: 'media', label: { de: 'Hintergrundbild', ar: 'الصورة الخلفية', en: 'Background image' } },
    {
      name: 'cta',
      type: 'group',
      label: { de: 'Call-to-Action Button', ar: 'زر الدعوة للعمل', en: 'Call-to-action button' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: { de: 'Beschriftung', ar: 'النص', en: 'Label' } },
        { name: 'url', type: 'text', label: { de: 'URL', ar: 'الرابط', en: 'URL' } },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'default',
      label: { de: 'Stil', ar: 'النمط', en: 'Variant' },
      options: [
        { label: { de: 'Standard (blauer Hintergrund)', en: 'Default (blue bg)' }, value: 'default' },
        { label: { de: 'Mit Bild', en: 'With image' }, value: 'image' },
        { label: { de: 'Kompakt', en: 'Compact' }, value: 'compact' },
      ],
    },
  ],
}
