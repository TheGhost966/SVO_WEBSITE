import type { Block } from 'payload'

export const ContactBlock: Block = {
  slug: 'contact-block',
  labels: {
    singular: { de: 'Kontaktblock', ar: 'كتلة الاتصال', en: 'Contact block' },
    plural: { de: 'Kontaktblöcke', ar: 'كتل الاتصال', en: 'Contact blocks' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, label: { de: 'Überschrift', ar: 'العنوان', en: 'Heading' } },
    { name: 'subheading', type: 'textarea', localized: true, label: { de: 'Einleitungstext', ar: 'مقدمة', en: 'Intro text' } },
    {
      name: 'showForm',
      type: 'checkbox',
      defaultValue: true,
      label: { de: 'Kontaktformular anzeigen', ar: 'إظهار نموذج الاتصال', en: 'Show contact form' },
    },
    {
      name: 'contactDetails',
      type: 'group',
      label: { de: 'Kontaktdaten anzeigen', ar: 'بيانات الاتصال', en: 'Contact details to display' },
      fields: [
        { name: 'showAddress', type: 'checkbox', defaultValue: true, label: { de: 'Adresse', ar: 'العنوان', en: 'Address' } },
        { name: 'showPhone', type: 'checkbox', defaultValue: true, label: { de: 'Telefon', ar: 'الهاتف', en: 'Phone' } },
        { name: 'showEmail', type: 'checkbox', defaultValue: true, label: { de: 'E-Mail', ar: 'البريد الإلكتروني', en: 'Email' } },
        { name: 'showHours', type: 'checkbox', defaultValue: true, label: { de: 'Öffnungszeiten', ar: 'ساعات العمل', en: 'Opening hours' } },
      ],
    },
  ],
}
