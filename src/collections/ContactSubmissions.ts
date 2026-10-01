import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'
import { CONTACT_LIMITS } from '@/lib/contactLimits'

/**
 * `status` and `submittedAt` are server-controlled (QA S2): a new submission always starts as
 * `new` with the server's clock, whatever the caller sent, and `submittedAt` can never be edited
 * afterwards. Editors still move `status` through new → read → archived in the inbox.
 */
const serverControlledFields: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === 'create') {
    return { ...data, status: 'new', submittedAt: new Date().toISOString() }
  }
  return { ...data, submittedAt: originalDoc?.submittedAt }
}

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions',
  admin: {
    useAsTitle: 'subject',
    group: { de: 'System', ar: 'النظام', en: 'System' },
    defaultColumns: ['name', 'email', 'subject', 'status', 'submittedAt'],
    description: {
      de: 'Eingehende Kontaktformular-Nachrichten. Zugriff nur für Redakteure und höher.',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: CONTACT_LIMITS.name,
      label: { de: 'Name', ar: 'الاسم', en: 'Name' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      label: { de: 'E-Mail', ar: 'البريد الإلكتروني', en: 'Email' },
    },
    {
      name: 'subject',
      type: 'text',
      maxLength: CONTACT_LIMITS.subject,
      label: { de: 'Betreff', ar: 'الموضوع', en: 'Subject' },
    },
    {
      name: 'category',
      type: 'text',
      maxLength: CONTACT_LIMITS.category,
      label: { de: 'Kategorie', ar: 'الفئة', en: 'Category' },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: CONTACT_LIMITS.message,
      label: { de: 'Nachricht', ar: 'الرسالة', en: 'Message' },
    },
    {
      name: 'locale',
      type: 'select',
      options: [
        { label: 'Deutsch', value: 'de' },
        { label: 'عربي', value: 'ar' },
        { label: 'English', value: 'en' },
      ],
      label: { de: 'Sprache der Anfrage', ar: 'لغة الطلب', en: 'Request language' },
    },
    {
      name: 'consentGiven',
      type: 'checkbox',
      required: true,
      // `required` on a checkbox only means "is a boolean" — false (or omitted, which arrives as
      // false) would pass. A new submission must carry actual consent. Create-only, so legacy rows
      // stored without consent (via the formerly public REST route) stay editable in the inbox.
      validate: (value: boolean | null | undefined, { operation }: { operation?: string }) =>
        operation !== 'create' || value === true || 'Consent is required.',
      label: { de: 'Einwilligung zur Datenverarbeitung erteilt', ar: 'الموافقة على معالجة البيانات', en: 'Data processing consent given' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      label: { de: 'Bearbeitungsstatus', ar: 'حالة المعالجة', en: 'Processing status' },
      options: [
        { label: { de: 'Neu', ar: 'جديد', en: 'New' }, value: 'new' },
        { label: { de: 'Gelesen', ar: 'مقروء', en: 'Read' }, value: 'read' },
        { label: { de: 'Archiviert', ar: 'مؤرشف', en: 'Archived' }, value: 'archived' },
      ],
    },
    {
      name: 'submittedAt',
      type: 'date',
      label: { de: 'Eingegangen am', ar: 'تاريخ الإرسال', en: 'Submitted at' },
      admin: { date: { displayFormat: 'dd.MM.yyyy HH:mm' } },
    },
  ],
  hooks: {
    beforeChange: [serverControlledFields],
  },
  access: {
    // Not public (QA S2). The contact form writes through its server action
    // (src/lib/contactAction.ts → Local API), which validates, rate-limits and whitelists fields.
    create: isEditorOrAbove,
    read: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
