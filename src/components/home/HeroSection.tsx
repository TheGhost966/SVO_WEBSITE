import { Link } from '@/i18n/navigation'
import { MediaImage } from '@/components/ui/MediaImage'
import { ButtonLink } from '@/components/ui/Button'
import { resolveInternalHref } from '@/lib/internalHref'
import type { SiteSettingsDoc } from '@/types/payload'

/**
 * BRIEF-AMENDMENT-03 §1.1/§2.1: the homepage leads with identity — logo, association name,
 * mission statement, primary CTA — not wayfinding. No search input, no filter chips, no
 * personalised/account-shaped content (§2.4's disposition table: all deleted, none rebuilt here).
 */
const FALLBACK: Record<string, { orgName: string; tagline: string; ctaLabel: string }> = {
  de: { orgName: 'SVÖ — Syrischer Verband in Österreich', tagline: 'Bauen. Verbinden. Umsetzen.', ctaLabel: 'Über uns' },
  ar: { orgName: 'الاتحاد السوري في النمسا', tagline: 'نبني · نربط · ننفذ', ctaLabel: 'من نحن' },
  en: { orgName: 'SVÖ — Syrian Association in Austria', tagline: 'Building. Connecting. Delivering.', ctaLabel: 'About us' },
}

export function HeroSection({
  locale,
  siteSettings,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
}) {
  const fallback = FALLBACK[locale] ?? FALLBACK.de
  const hero = siteSettings?.homeGroup
  const headline = hero?.heroHeadline || siteSettings?.orgName || fallback.orgName
  const subline = hero?.heroSubline || siteSettings?.tagline || fallback.tagline
  const ctaLabel = hero?.heroCtaLabel || fallback.ctaLabel
  const ctaHref = resolveInternalHref(hero?.heroCtaHref || '/about', locale)
  const logo = siteSettings?.logo

  return (
    <section className="bg-brand-navy py-16 md:py-[96px]">
      <div
        className="mx-auto max-w-[1200px] flex flex-col items-center text-center gap-6"
        style={{ paddingInlineStart: 'clamp(24px, 8vw, 120px)', paddingInlineEnd: 'clamp(24px, 8vw, 120px)' }}
      >
        {logo && typeof logo !== 'string' && (
          <Link href="/" className="inline-block">
            <MediaImage media={logo} size="original" className="h-16 md:h-20 w-auto" priority />
          </Link>
        )}
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">{headline}</h1>
        <p className="text-lg md:text-xl text-white/80 font-medium max-w-2xl">{subline}</p>
        <div className="mt-2">
          <ButtonLink href={ctaHref} variant="primary" size="lg">
            {ctaLabel}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
