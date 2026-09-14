import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ContactForm } from '@/components/ui/ContactForm'
import { getSiteSettings } from '@/lib/queries'

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return {
    title: t('title'),
    alternates: {
      languages: {
        de: `${SERVER}/de/kontakt`,
        ar: `${SERVER}/ar/contact`,
        en: `${SERVER}/en/contact`,
      },
    },
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, settings] = await Promise.all([
    getTranslations('contact'),
    getSiteSettings(locale),
  ])

  const contact = settings?.contactGroup

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} />

      <div className="grid md:grid-cols-[1fr_320px] gap-12 items-start">
        {/* Form column */}
        <div>
          <ContactForm locale={locale} />
        </div>

        {/* Office details column */}
        <aside className="space-y-6">
          {contact?.address && (
            <div>
              <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">
                {t('address')}
              </p>
              <p className="text-sm text-ink whitespace-pre-line">{contact.address}</p>
            </div>
          )}

          {contact?.phone && (
            <div>
              <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">
                {t('phone')}
              </p>
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="text-sm text-brand-blue hover:text-brand-navy transition-colors"
              >
                {contact.phone}
              </a>
            </div>
          )}

          {contact?.email && (
            <div>
              <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">
                {t('email')}
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="text-sm text-brand-blue hover:text-brand-navy transition-colors break-all"
              >
                {contact.email}
              </a>
            </div>
          )}

          {contact?.openingHours && (
            <div>
              <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">
                {t('openingHours')}
              </p>
              <p className="text-sm text-ink whitespace-pre-line">{contact.openingHours}</p>
            </div>
          )}

          {/* Placeholder when SiteSettings hasn't been seeded */}
          {!contact?.address && !contact?.phone && !contact?.email && (
            <p className="text-xs text-ink-50">
              [{locale.toUpperCase()}] Kontaktdaten werden nach Einrichtung der Websiteeinstellungen angezeigt.
            </p>
          )}

          {/* DSGVO note */}
          <p className="text-xs text-ink-50 border-t border-border pt-4">
            {locale === 'ar'
              ? 'يتم حذف بيانات نموذج الاتصال تلقائيًا بعد 12 شهرًا وفقًا لـ DSGVO.'
              : locale === 'en'
                ? 'Contact form data is automatically deleted after 12 months in accordance with GDPR.'
                : 'Kontaktformulardaten werden gemäß DSGVO nach 12 Monaten automatisch gelöscht.'}
          </p>
        </aside>
      </div>
    </div>
  )
}
