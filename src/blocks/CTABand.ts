import type { Block } from 'payload'

export const CTABand: Block = {
  slug: 'cta-band',
  labels: {
    singular: { de: 'CTA-Band', ar: 'شريط الدعوة', en: 'CTA band' },
    plural: { de: 'CTA-Bänder', ar: 'أشرطة الدعوة', en: 'CTA bands' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    { name: 'subheading', type: 'text', localized: true, label: { de: 'Untertitel', ar: 'عنوان فرعي', en: 'Subheading' } },
    {
      name: 'primaryCta',
      type: 'group',
      label: { de: 'Primärer Button', ar: 'الزر الرئيسي', en: 'Primary button' },
      fields: [
        { name: 'label', type: 'text', localized: true, required: true, label: { de: 'Beschriftung', ar: 'النص', en: 'Label' } },
        { name: 'url', type: 'text', required: true, label: { de: 'URL', ar: 'الرابط', en: 'URL' } },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      label: { de: 'Sekundärer Button (optional)', ar: 'الزر الثانوي', en: 'Secondary button (optional)' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: { de: 'Beschriftung', ar: 'النص', en: 'Label' } },
        { name: 'url', type: 'text', label: { de: 'URL', ar: 'الرابط', en: 'URL' } },
      ],
    },
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'green',
      label: { de: 'Hintergrundfarbe', ar: 'لون الخلفية', en: 'Background colour' },
      options: [
        { label: { de: 'Grün', ar: 'أخضر', en: 'Green' }, value: 'green' },
        { label: { de: 'Marineblau', ar: 'كحلي', en: 'Navy' }, value: 'navy' },
        { label: { de: 'Blau', ar: 'أزرق', en: 'Blue' }, value: 'blue' },
      ],
    },
  ],
}
