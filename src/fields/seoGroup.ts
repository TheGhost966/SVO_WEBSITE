import type { Field } from 'payload'

export const seoGroup: Field = {
  name: 'seo',
  type: 'group',
  label: { de: 'SEO', ar: 'SEO', en: 'SEO' },
  admin: {
    description: {
      de: 'Suchmaschinen-Einstellungen. Leer lassen = automatisch aus Titel/Beschreibung generiert.',
      ar: 'إعدادات محرك البحث. اتركها فارغة = يتم إنشاؤها تلقائيًا.',
      en: 'Search engine settings. Leave blank to auto-generate from title/description.',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      maxLength: 60,
      label: { de: 'Titel (max. 60 Zeichen)', ar: 'العنوان (60 حرف)', en: 'Title (max 60 chars)' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 160,
      label: {
        de: 'Beschreibung (max. 160 Zeichen)',
        ar: 'الوصف (160 حرف)',
        en: 'Description (max 160 chars)',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Social-Media-Bild', ar: 'صورة وسائل التواصل', en: 'Social media image' },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      label: {
        de: 'Von Suchmaschinen ausschließen (noindex)',
        ar: 'استبعاد من محركات البحث',
        en: 'Exclude from search engines (noindex)',
      },
    },
  ],
}
