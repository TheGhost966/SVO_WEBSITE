import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { isAdminOrBoard } from '@/lib/access'
import { tags } from '@/lib/payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: {
    group: { de: 'Einstellungen', ar: 'الإعدادات', en: 'Settings' },
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Logo', ar: 'الشعار', en: 'Logo' },
    },
    {
      name: 'logoAlt',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Logo (alternative Version, z.B. weiß)', ar: 'الشعار البديل', en: 'Logo (alternative, e.g. white)' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'orgName',
          type: 'text',
          localized: true,
          label: { de: 'Organisationsname', ar: 'اسم المنظمة', en: 'Organisation name' },
          admin: { width: '50%' },
        },
        {
          name: 'tagline',
          type: 'text',
          localized: true,
          label: { de: 'Tagline', ar: 'الشعار', en: 'Tagline' },
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'contactGroup',
      type: 'group',
      label: { de: 'Kontaktdaten', ar: 'معلومات الاتصال', en: 'Contact details' },
      fields: [
        { name: 'address', type: 'textarea', label: { de: 'Adresse', ar: 'العنوان', en: 'Address' } },
        { name: 'phone', type: 'text', label: { de: 'Telefon', ar: 'الهاتف', en: 'Phone' } },
        { name: 'email', type: 'email', label: { de: 'E-Mail', ar: 'البريد الإلكتروني', en: 'Email' } },
        {
          name: 'openingHours',
          type: 'textarea',
          localized: true,
          label: { de: 'Öffnungszeiten', ar: 'ساعات العمل', en: 'Opening hours' },
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: { de: 'Social-Media-Links', ar: 'روابط التواصل الاجتماعي', en: 'Social media links' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: ['facebook', 'instagram', 'youtube', 'linkedin', 'twitter', 'tiktok'],
          label: { de: 'Plattform', ar: 'المنصة', en: 'Platform' },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: { de: 'URL', ar: 'الرابط', en: 'URL' },
        },
      ],
    },
    {
      name: 'seoGroup',
      type: 'group',
      label: { de: 'Standard-SEO', ar: 'SEO الافتراضي', en: 'Default SEO' },
      fields: [
        {
          name: 'defaultTitle',
          type: 'text',
          localized: true,
          label: { de: 'Standard-Seitentitel', ar: 'عنوان الصفحة الافتراضي', en: 'Default page title' },
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          localized: true,
          label: { de: 'Standard-Beschreibung', ar: 'الوصف الافتراضي', en: 'Default description' },
        },
        {
          name: 'defaultOgImage',
          type: 'upload',
          relationTo: 'media',
          label: { de: 'Standard-Social-Bild', ar: 'الصورة الاجتماعية الافتراضية', en: 'Default OG image' },
        },
      ],
    },
    {
      name: 'jobResourceLinks',
      type: 'array',
      label: { de: 'Stellenangebote — externe Links', ar: 'روابط فرص العمل الخارجية', en: 'Job resource links' },
      labels: {
        singular: { de: 'Link', ar: 'رابط', en: 'Link' },
        plural: { de: 'Links', ar: 'روابط', en: 'Links' },
      },
      admin: {
        description: {
          de: 'Kuratierte Links zu AMS, karriere.at usw. — siehe DECISIONS.md, warum es (noch) keine eigene Jobbörse gibt.',
          en: 'Curated links to AMS, karriere.at, etc. — see DECISIONS.md for why this isn\'t a full job board (yet).',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
          label: { de: 'Beschriftung', ar: 'التسمية', en: 'Label' },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: { de: 'URL', ar: 'الرابط', en: 'URL' },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: { de: 'Beschreibung', ar: 'الوصف', en: 'Description' },
        },
      ],
    },
    {
      name: 'submissionRetentionMonths',
      type: 'number',
      defaultValue: 12,
      label: { de: 'Aufbewahrungsfrist Kontaktformular (Monate)', ar: 'مدة الاحتفاظ بالبيانات (أشهر)', en: 'Contact form retention (months)' },
      admin: {
        description: {
          de: 'DSGVO: Kontaktanfragen werden nach dieser Anzahl Monate automatisch gelöscht.',
          en: 'GDPR: Contact submissions are automatically deleted after this many months.',
        },
      },
    },
    {
      name: 'expertApplicationRetentionMonths',
      type: 'number',
      defaultValue: 12,
      label: {
        de: 'Aufbewahrungsfrist unveröffentlichte Expert:innen-Anträge (Monate)',
        ar: 'مدة الاحتفاظ بطلبات الخبراء غير المنشورة (أشهر)',
        en: 'Unpublished expert application retention (months)',
      },
      admin: {
        description: {
          de: 'DSGVO: Anträge, die nie veröffentlicht werden, werden nach dieser Anzahl Monate automatisch gelöscht.',
          en: 'GDPR: Expert applications that never reach published are automatically deleted after this many months.',
        },
      },
    },
    {
      name: 'boardNotificationEmails',
      type: 'array',
      label: { de: 'E-Mail-Empfänger für Überprüfungs-Benachrichtigungen', ar: 'مستلمو البريد الإلكتروني للمراجعة', en: 'Review notification email recipients' },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          label: { de: 'E-Mail-Adresse', ar: 'البريد الإلكتروني', en: 'Email address' },
        },
      ],
      admin: {
        description: {
          de: 'Diese Adressen erhalten eine E-Mail, wenn ein Inhalt zur Überprüfung eingereicht wird.',
        },
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag(tags.siteSettings(), { expire: 0 })
        } catch {
          // Outside Next.js context (CLI, migrations) — revalidateTag is a no-op
        }
      },
    ],
  },
  access: {
    read: () => true,
    update: isAdminOrBoard,
  },
}
