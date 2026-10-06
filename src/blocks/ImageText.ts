import type { Block } from 'payload'

export const ImageText: Block = {
  slug: 'image-text',
  labels: {
    singular: { de: 'Bild + Text', ar: 'صورة + نص', en: 'Image + text' },
    plural: { de: 'Bild + Text Blöcke', ar: 'كتل الصورة والنص', en: 'Image + text blocks' },
  },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', required: true, label: { de: 'Bild', ar: 'الصورة', en: 'Image' } },
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    { name: 'body', type: 'richText', localized: true, required: true, label: { de: 'Text', ar: 'النص', en: 'Body' } },
    {
      name: 'imagePosition',
      type: 'radio',
      defaultValue: 'start',
      label: { de: 'Bildposition', ar: 'موضع الصورة', en: 'Image position' },
      options: [
        { label: { de: 'Links (Anfang)', ar: 'اليمين (البداية)', en: 'Start' }, value: 'start' },
        { label: { de: 'Rechts (Ende)', ar: 'اليسار (النهاية)', en: 'End' }, value: 'end' },
      ],
      admin: {
        description: {
          de: 'Wird in RTL-Layouts automatisch gespiegelt.',
          ar: 'ينعكس تلقائيًا في الصفحات التي تُكتب من اليمين إلى اليسار.',
          en: 'Mirrored automatically in right-to-left layouts.',
        },
      },
    },
    {
      name: 'cta',
      type: 'group',
      label: { de: 'Optionaler Button', ar: 'زر اختياري', en: 'Optional button' },
      fields: [
        { name: 'label', type: 'text', localized: true, label: { de: 'Beschriftung', ar: 'النص', en: 'Label' } },
        { name: 'url', type: 'text', label: { de: 'URL', ar: 'الرابط', en: 'URL' } },
      ],
    },
  ],
}
