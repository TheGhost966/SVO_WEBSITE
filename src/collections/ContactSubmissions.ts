import type { CollectionConfig } from 'payload'
import { isEditorOrAbove } from '@/lib/access'

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
      label: { de: 'Betreff', ar: 'الموضوع', en: 'Subject' },
    },
    {
      name: 'category',
      type: 'text',
      label: { de: 'Kategorie', ar: 'الفئة', en: 'Category' },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
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
  access: {
    create: () => true, // public endpoint — form submissions
    read: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
