import type { Block } from 'payload'

export const LogoGrid: Block = {
  slug: 'logo-grid',
  labels: {
    singular: { de: 'Logo-Raster', ar: 'شبكة الشعارات', en: 'Logo grid' },
    plural: { de: 'Logo-Raster', ar: 'شبكات الشعارات', en: 'Logo grids' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    {
      name: 'logos',
      type: 'array',
      label: { de: 'Logos', ar: 'الشعارات', en: 'Logos' },
      labels: {
        singular: { de: 'Logo', ar: 'شعار', en: 'Logo' },
        plural: { de: 'Logos', ar: 'الشعارات', en: 'Logos' },
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: { de: 'Logo', ar: 'الشعار', en: 'Logo' } },
        { name: 'name', type: 'text', required: true, label: { de: 'Name (für Alt-Text)', ar: 'الاسم', en: 'Name (for alt text)' } },
        { name: 'url', type: 'text', label: { de: 'Link (optional)', ar: 'الرابط', en: 'Link (optional)' } },
      ],
    },
  ],
}
