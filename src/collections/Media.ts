import path from 'path'
import type { CollectionConfig } from 'payload'
import { isEditorOrAbove, isLoggedIn } from '@/lib/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  upload: {
    // Payload serves from staticDir; Next.js serves public/ statically
    staticDir: path.resolve(process.cwd(), 'public/media'),
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400,  height: 300,  position: 'centre' },
      { name: 'card',      width: 768,  height: 512,  position: 'centre' },
      { name: 'hero',      width: 1920, height: 1080, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Alt-Text (Barrierefreiheit)', ar: 'النص البديل', en: 'Alt text (accessibility)' },
      admin: {
        description: {
          de: 'Pflichtfeld. Beschreibt das Bild für Screenreader und SEO.',
          en: 'Required. Describes the image for screen readers and SEO.',
        },
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: { de: 'Bildunterschrift', ar: 'تعليق الصورة', en: 'Caption' },
    },
    {
      name: 'credit',
      type: 'text',
      label: { de: 'Bildnachweis / Fotograf', ar: 'حقوق الصورة', en: 'Photo credit' },
    },
    {
      name: 'consentOnFile',
      type: 'checkbox',
      defaultValue: false,
      label: {
        de: 'Einwilligung zur Veröffentlichung liegt vor',
        ar: 'الموافقة على النشر متوفرة',
        en: 'Publication consent on file',
      },
      admin: {
        description: {
          de: 'DSGVO: Bei Fotos von identifizierbaren Personen muss eine schriftliche Einwilligung vorliegen.',
          en: 'GDPR: Photos of identifiable persons require documented written consent.',
        },
      },
    },
  ],
  access: {
    read: () => true,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isLoggedIn,
  },
}
