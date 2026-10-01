import { Link } from '@/i18n/navigation'
import { BadgeCheck, Globe, MapPin } from 'lucide-react'
import { MediaImage } from '@/components/ui/MediaImage'
import { resolveInternalHref } from '@/lib/internalHref'
import { SmartLink } from '@/components/ui/SmartLink'
import type { ExpertDoc, CategoryRef, ResolvedMedia } from '@/types/payload'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

type ExpertCategory = { id: string; name?: string | null; slug?: string | null }

const AVATAR_TINTS = ['#0B4EA2', '#3B8A33', '#8A5A2B', '#6B3F9E']

function initials(name: string): string {
  return name
    .replace(/^(dr|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Figma 5.png: navy band, translucent cards — coloured avatar, verified pill, name, field, city,
 * languages, "view profile" button — followed by a "Join the network" panel. The verified pill only
 * shows for `verificationStatus === 'verified'` (never implied). The Figma's filter chips are real
 * links to `/experts?cat=<slug>` (the same filter the experts index itself uses) — not the Figma's
 * state/language filters, which no field on `Experts` backs yet.
 */
export function ExpertsSection({
  locale,
  experts,
  categories,
  t,
}: {
  locale: string
  experts: ExpertDoc[]
  categories: ExpertCategory[]
  t: (key: string) => string
}) {
  if (experts.length === 0) return null
  const copy = homeCopy(locale)
  const shown = experts.slice(0, 4)
  const shownCategories = categories.slice(0, 4)

  return (
    <HomeSectionShell id="experts-heading" bg="bg-brand-navy">
      <SectionHead
        id="experts-heading"
        eyebrow={copy.eyebrow.experts}
        title={t('expertsHeading')}
        subtitle={copy.expertsSubtitle}
        action={{ href: '/experts', label: t('allExperts') }}
        locale={locale}
        dark
      />
      {shownCategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <SmartLink
            href={resolveInternalHref('/experts', locale)}
            className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
          >
            {t('allExperts')}
          </SmartLink>
          {shownCategories.map((cat) => (
            <SmartLink
              key={cat.id}
              href={resolveInternalHref(`/experts?cat=${cat.slug}`, locale)}
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
            >
              {cat.name}
            </SmartLink>
          ))}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((expert, i) => {
          const name = expert.name ?? '—'
          const fields = ((expert.categories ?? []) as Array<CategoryRef | string>)
            .filter((c): c is CategoryRef => typeof c !== 'string' && !!c.name)
            .map((c) => c.name)
            .join(' · ')
          const langs = (expert.languages ?? []).map((l) => l.language).filter(Boolean).join(' · ')
          const photo = expert.photo && typeof expert.photo !== 'string' ? (expert.photo as ResolvedMedia) : null
          return (
            <article
              key={expert.id}
              className="flex flex-col rounded-[18px] border border-white/15 bg-white/[0.06] p-6"
            >
              <div className="flex items-start justify-between gap-3">
                {expert.verificationStatus === 'verified' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/20 px-3 py-1 text-xs font-medium text-brand-green">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {copy.verified}
                  </span>
                ) : (
                  <span />
                )}
                {photo ? (
                  <span className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full">
                    <MediaImage media={photo} size="thumbnail" fill />
                  </span>
                ) : (
                  <span
                    className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: AVATAR_TINTS[i % AVATAR_TINTS.length] }}
                    aria-hidden="true"
                  >
                    {initials(name)}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-bold leading-snug text-white">{name}</h3>
              {fields && <p className="mt-1 text-sm text-white/70">{fields}</p>}
              <div className="mt-4 flex flex-col gap-2 text-xs text-white/60">
                {expert.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {expert.city}
                  </span>
                )}
                {langs && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {langs}
                  </span>
                )}
              </div>
              <Link
                href={{ pathname: '/experts/[slug]', params: { slug: expert.slug ?? '' } }}
                className="mt-6 block rounded-xl bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/25"
              >
                {copy.viewProfile}
              </Link>
            </article>
          )
        })}
      </div>

      <div className="mt-8 flex flex-col gap-5 rounded-[18px] border border-white/15 bg-white/[0.06] p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h3 className="text-lg font-bold text-white md:text-xl">{copy.expertCta.heading}</h3>
          <p className="mt-1 text-sm text-white/65">{copy.expertCta.body}</p>
        </div>
        <SmartLink
          href={resolveInternalHref('/experts/apply', locale)}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-green px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dk"
        >
          {copy.expertCta.button}
        </SmartLink>
      </div>
    </HomeSectionShell>
  )
}
