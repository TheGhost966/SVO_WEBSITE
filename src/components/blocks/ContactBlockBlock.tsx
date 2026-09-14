import { getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ContactForm } from '@/components/ui/ContactForm'
import { getSiteSettings } from '@/lib/queries'
import type { ContactPageBlock } from '@/types/payload'

export async function ContactBlockBlock({ block, locale }: { block: ContactPageBlock; locale: string }) {
  const { heading, subheading, showForm = true, contactDetails } = block
  const [t, settings] = await Promise.all([
    getTranslations({ locale, namespace: 'contact' }),
    getSiteSettings(locale),
  ])
  const contact = settings?.contactGroup

  const showAddress = contactDetails?.showAddress !== false && !!contact?.address
  const showPhone = contactDetails?.showPhone !== false && !!contact?.phone
  const showEmail = contactDetails?.showEmail !== false && !!contact?.email
  const showHours = contactDetails?.showHours !== false && !!contact?.openingHours
  const hasDetails = showAddress || showPhone || showEmail || showHours

  return (
    <section className="py-12 md:py-[var(--section-y-desktop)]">
      <div
        className="mx-auto max-w-[var(--max-w-content)]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {(heading || subheading) && (
          <SectionHeader title={heading ?? ''} subtitle={subheading ?? undefined} />
        )}

        <div className={showForm && hasDetails ? 'grid md:grid-cols-[1fr_320px] gap-12 items-start' : ''}>
          {showForm && (
            <div>
              <ContactForm locale={locale} />
            </div>
          )}

          {hasDetails && (
            <aside className="space-y-6">
              {showAddress && <Detail label={t('address')} value={contact!.address!} />}

              {showPhone && (
                <div>
                  <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">{t('phone')}</p>
                  <a
                    href={`tel:${contact!.phone!.replace(/\s/g, '')}`}
                    className="text-sm text-brand-blue hover:text-brand-navy transition-colors"
                  >
                    {contact!.phone}
                  </a>
                </div>
              )}

              {showEmail && (
                <div>
                  <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">{t('email')}</p>
                  <a
                    href={`mailto:${contact!.email}`}
                    className="text-sm text-brand-blue hover:text-brand-navy transition-colors break-all"
                  >
                    {contact!.email}
                  </a>
                </div>
              )}

              {showHours && <Detail label={t('openingHours')} value={contact!.openingHours!} />}
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm text-ink whitespace-pre-line">{value}</p>
    </div>
  )
}
