import { ButtonLink } from '@/components/ui/Button'
import { resolveInternalHref } from '@/lib/internalHref'
import type { SiteSettingsDoc } from '@/types/payload'

const FALLBACK: Record<string, { heading: string; body: string; ctaLabel: string }> = {
  de: { heading: 'Kontaktieren Sie uns', body: 'Haben Sie Fragen oder möchten Sie mehr erfahren?', ctaLabel: 'Jetzt Kontakt aufnehmen' },
  ar: { heading: 'تواصل معنا', body: 'هل لديك أسئلة أو تريد معرفة المزيد؟', ctaLabel: 'اتصل بنا الآن' },
  en: { heading: 'Get in touch', body: 'Have questions or want to learn more?', ctaLabel: 'Contact us now' },
}

export function CtaBandSection({
  locale,
  siteSettings,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
}) {
  const fallback = FALLBACK[locale] ?? FALLBACK.de
  const cta = siteSettings?.homeGroup
  const heading = cta?.ctaBandHeading || fallback.heading
  const body = cta?.ctaBandBody || fallback.body
  const ctaLabel = cta?.ctaBandCtaLabel || fallback.ctaLabel
  const ctaHref = resolveInternalHref(cta?.ctaBandCtaHref || '/contact', locale)

  return (
    <section className="bg-brand-green py-16 md:py-20">
      <div
        className="mx-auto max-w-[1200px] text-center"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <h2 className="text-2xl md:text-4xl font-bold text-white">{heading}</h2>
        <p className="mt-4 text-white/80">{body}</p>
        <div className="mt-8">
          <ButtonLink href={ctaHref} variant="secondary" size="lg">
            {ctaLabel}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
