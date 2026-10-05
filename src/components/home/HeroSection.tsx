import { Link } from '@/i18n/navigation'
import { MapPin, Search } from 'lucide-react'
import { MediaImage } from '@/components/ui/MediaImage'
import { resolveInternalHref } from '@/lib/internalHref'
import { SmartLink } from '@/components/ui/SmartLink'
import { forwardArrow } from '@/i18n/routing'
import type { RoadmapDoc, SiteSettingsDoc } from '@/types/payload'
import { homeCopy } from './copy'

/**
 * Figma hero (`design/figma-homepage-exports/1.png`): navy→blue gradient, badge pill, large headline,
 * muted subline, a real search bar, situation chips, and a roadmap card opposite the text.
 *
 * Deliberate differences from the Figma:
 *  - the card is an *example roadmap* built from the first published roadmap's real steps, not the
 *    Figma's logged-in "3 of 6 steps done" progress card (no accounts, no progress tracking exists);
 *  - no login / join-us buttons (no public accounts exist).
 * Headline/subline: CMS (`SiteSettings.homeGroup`) wins; otherwise the Figma's own wording.
 * The search bar is a real `<form>` GET to `/search` (works without JS) — see `searchSite` in
 * `src/lib/queries.ts` and `src/app/[locale]/search/page.tsx`.
 */
export function HeroSection({
  locale,
  siteSettings,
  roadmap,
}: {
  locale: string
  siteSettings: SiteSettingsDoc | null
  roadmap?: RoadmapDoc | null
}) {
  const copy = homeCopy(locale)
  const hero = siteSettings?.homeGroup
  const headline = hero?.heroHeadline || copy.heroHeadline
  const subline = hero?.heroSubline || copy.heroSubline
  const logo = siteSettings?.logo

  const steps = (roadmap?.steps ?? []).filter((s) => s?.title)
  const shownSteps = steps.slice(0, 4)

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #062E57 0%, #0A3F7C 55%, #0B4EA2 100%)' }}
    >
      <div
        className={`mx-auto max-w-[1200px] grid gap-12 items-center py-16 md:py-[104px] ${
          roadmap && shownSteps.length > 0 ? 'lg:grid-cols-[1.15fr_0.85fr]' : ''
        }`}
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {/* Text column — first in DOM, so it sits on the start side (right in Arabic, as in the Figma) */}
        <div className="flex flex-col items-start gap-6">
          {logo && typeof logo !== 'string' && (
            <Link href="/" className="inline-block">
              <MediaImage media={logo} size="original" className="h-14 w-auto" priority sizes="220px" />
            </Link>
          )}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm text-white/90">
            <MapPin className="h-4 w-4 text-brand-green" aria-hidden="true" />
            {copy.heroBadge}
          </span>
          <h1 className="text-4xl md:text-[52px] font-bold leading-[1.25] max-w-4xl text-balance">{headline}</h1>
          <p className="text-base md:text-xl text-white/75 leading-relaxed max-w-2xl">{subline}</p>
          <form
            action={resolveInternalHref('/search', locale)}
            method="get"
            className="flex w-full max-w-2xl items-center gap-1.5 rounded-full bg-white p-1.5 shadow-lg"
          >
            <button
              type="submit"
              className="flex shrink-0 items-center gap-2 rounded-full bg-brand-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dk"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {copy.searchCta}
            </button>
            <input
              type="search"
              name="q"
              placeholder={copy.searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-50 focus:outline-none"
            />
          </form>
          <div className="flex flex-wrap gap-3 pt-2">
            {copy.chips.map((chip) => (
              <SmartLink
                key={chip.href + chip.label}
                href={resolveInternalHref(chip.href, locale)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  chip.active
                    ? 'border-white/40 bg-white/20 text-white hover:bg-white/30'
                    : 'border-white/25 text-white/85 hover:bg-white/10'
                }`}
              >
                {chip.label}
              </SmartLink>
            ))}
          </div>
        </div>

        {/* Example roadmap card — real CMS steps; hidden when no roadmap has steps yet */}
        {roadmap && shownSteps.length > 0 && (
          <div className="rounded-[24px] bg-surface p-6 md:p-7 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-50 mb-1">{copy.exampleRoadmap}</p>
                <h2 className="text-xl font-bold leading-snug">{roadmap.title}</h2>
                {steps[0]?.responsibleAuthority && (
                  <p className="mt-1 text-sm text-ink-50">{steps[0].responsibleAuthority}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-brand-green-lt px-3 py-1 text-xs font-medium text-brand-green-dk">
                {copy.stepsCount(steps.length)}
              </span>
            </div>
            <ol className="mt-5 flex flex-col gap-3">
              {shownSteps.map((step, i) => (
                <li key={step.id ?? i} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-border text-xs font-semibold text-ink-70"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-snug">{step.title}</span>
                    {(step.timing || step.responsibleAuthority) && (
                      <span className="block text-xs text-ink-50">{step.timing || step.responsibleAuthority}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
            <Link
              href={{ pathname: '/roadmaps/[roadmap]', params: { roadmap: roadmap.slug ?? '' } }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-semibold text-white hover:bg-brand-blue transition-colors"
            >
              {copy.exampleRoadmapCta}
              <span aria-hidden="true">{forwardArrow(locale)}</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
