import { Heart, Lightbulb } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { resolveInternalHref } from '@/lib/internalHref'
import { SmartLink } from '@/components/ui/SmartLink'
import { forwardArrow } from '@/i18n/routing'
import type { SiteSettingsDoc } from '@/types/payload'
import { homeCopy } from './copy'

/**
 * Figma 8.png: two side-by-side cards — a green "Become a volunteer" card and a navy "I have an
 * idea" card. Both link to the contact form with the category pre-selected (neither feature has
 * its own module, so there is no dead end). If the board has filled in the
 * single `homeGroup.ctaBand*` fields, that authored band is shown instead, as before.
 */
export function CtaBandSection({
  locale,
  siteSettings,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
}) {
  const cta = siteSettings?.homeGroup
  // An authored band replaces the two built-in cards, so it has to be complete: a heading alone
  // used to produce a band with an empty button and no way to get in touch.
  const authored = Boolean(cta?.ctaBandHeading && cta?.ctaBandCtaLabel)

  if (authored) {
    return (
      <section className="bg-brand-green py-16 md:py-20">
        <div
          className="mx-auto max-w-[1200px] text-center"
          style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
        >
          <h2 className="text-2xl md:text-4xl font-bold text-white">{cta?.ctaBandHeading}</h2>
          {cta?.ctaBandBody && <p className="mt-4 text-white/80">{cta.ctaBandBody}</p>}
          <div className="mt-8">
            <ButtonLink href={resolveInternalHref(cta?.ctaBandCtaHref || '/contact', locale)} variant="secondary" size="lg">
              {cta?.ctaBandCtaLabel}
            </ButtonLink>
          </div>
        </div>
      </section>
    )
  }

  const copy = homeCopy(locale)
  const { volunteer, idea } = copy.twin

  return (
    <section className="bg-cream py-16 md:py-[96px]">
      <div
        className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-2"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <div className="flex flex-col items-start rounded-[24px] bg-brand-green-lt p-8 md:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-brand-green-dk">
            <Heart className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-3xl font-bold text-[#1F5E1B]">{volunteer.heading}</h2>
          <p className="mt-3 flex-1 text-base leading-relaxed text-[#2E6B29]">{volunteer.body}</p>
          <SmartLink
            href={resolveInternalHref('/contact?category=volunteering', locale)}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-green px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dk"
          >
            {volunteer.button}
            <span aria-hidden="true">{forwardArrow(locale)}</span>
          </SmartLink>
        </div>
        <div className="flex flex-col items-start rounded-[24px] bg-brand-navy p-8 md:p-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-brand-green">
            <Lightbulb className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-3xl font-bold text-white">{idea.heading}</h2>
          <p className="mt-3 flex-1 text-base leading-relaxed text-white/70">{idea.body}</p>
          <SmartLink
            href={resolveInternalHref('/contact?category=idea', locale)}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-green px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dk"
          >
            {idea.button}
            <span aria-hidden="true">{forwardArrow(locale)}</span>
          </SmartLink>
        </div>
      </div>
    </section>
  )
}
