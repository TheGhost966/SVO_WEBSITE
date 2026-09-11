import type { Block } from 'payload'

export const FAQBlock: Block = {
  slug: 'faq',
  labels: {
    singular: { de: 'FAQ', ar: 'الأسئلة الشائعة', en: 'FAQ' },
    plural: { de: 'FAQs', ar: 'الأسئلة الشائعة', en: 'FAQs' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      label: { de: 'Fragen & Antworten', ar: 'الأسئلة والأجوبة', en: 'Questions & answers' },
      fields: [
        { name: 'question', type: 'text', localized: true, required: true, label: { de: 'Frage', ar: 'السؤال', en: 'Question' } },
        { name: 'answer', type: 'richText', localized: true, required: true, label: { de: 'Antwort', ar: 'الجواب', en: 'Answer' } },
      ],
    },
  ],
}
