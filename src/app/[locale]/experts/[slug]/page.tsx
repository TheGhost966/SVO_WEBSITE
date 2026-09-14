import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { MediaImage } from '@/components/ui/MediaImage'
import { getExpertBySlug } from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import type { ResolvedMedia } from '@/types/payload'

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const EXPERTS_LABEL: Record<string, string> = { de: 'Expert:innen', ar: 'الخبراء', en: 'Experts' }

type Props = { params: Promise<{ locale: string; slug: string }> }

// No hreflang / per-locale slug lookup needed — `slug` is not a localized
// field on Experts (see Experts collection comment), so the same slug
// resolves in every locale.
export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'experts',
      where: { reviewStatus: { equals: 'published' } },
      depth: 0,
      limit: 500,
    })
    const slugs = result.docs
      .map((d) => (d as { slug?: unknown }).slug)
      .filter((s): s is string => typeof s === 'string')
    const params: { locale: string; slug: string }[] = []
    for (const locale of ['de', 'ar', 'en']) {
      for (const slug of slugs) params.push({ locale, slug })
    }
    return params
  } catch {
    return []
  }
}

export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const expert = await getExpertBySlug(slug, locale)
  if (!expert) return {}
  return {
    title: expert.name ?? undefined,
    description: expert.bio ?? undefined,
    // No Person JSON-LD and no rich indexing push for pages carrying contact
    // details of third parties (BRIEF-AMENDMENT-01 §2.7) — plain metadata only.
  }
}

export default async function ExpertPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('experts')

  const expert = await getExpertBySlug(slug, locale)
  if (!expert) notFound()

  const image = expert.photo && typeof expert.photo !== 'string' ? (expert.photo as ResolvedMedia) : null

  return (
    <article
      className="mx-auto max-w-[900px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <div className="py-10 md:py-14">
        <Breadcrumb
          items={[
            { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
            { label: EXPERTS_LABEL[locale] ?? 'Experts', href: '/experts' },
            { label: expert.name ?? '' },
          ]}
        />

        <div className="flex flex-col sm:flex-row gap-6 items-start mb-6">
          {image && (
            <div className="shrink-0 w-24 h-24 rounded-full overflow-hidden bg-ink/10 relative">
              <MediaImage media={image} size="thumbnail" fill />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-ink leading-tight mb-2">{expert.name}</h1>
            {expert.city && <p className="text-ink-50">{expert.city}</p>}
            {expert.categories && expert.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {expert.categories
                  .filter((c): c is { id: string; name?: string | null } => typeof c === 'object')
                  .map((c) => (
                    <span key={c.id} className="text-xs bg-brand-green-lt text-brand-green-dk rounded-control px-2 py-0.5">
                      {c.name}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        {expert.bio && <p className="text-ink-70 leading-relaxed mb-8">{expert.bio}</p>}

        <div className="rounded-card border border-border bg-surface p-6 flex flex-col gap-3">
          <h2 className="font-semibold text-ink">{t('contact')}</h2>
          {expert.languages && expert.languages.length > 0 && (
            <p className="text-sm text-ink-70">
              <span className="font-semibold text-ink-70">{t('languages')}: </span>
              {expert.languages.map((l) => l.language).filter(Boolean).join(', ')}
            </p>
          )}
          {expert.contactEmail && (
            <a href={`mailto:${expert.contactEmail}`} className="text-sm text-brand-blue hover:text-brand-navy underline">
              {expert.contactEmail}
            </a>
          )}
          {expert.contactPhone && (
            <a href={`tel:${expert.contactPhone}`} className="text-sm text-brand-blue hover:text-brand-navy underline">
              {expert.contactPhone}
            </a>
          )}
          {expert.website && (
            <a
              href={expert.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-sm text-brand-blue hover:text-brand-navy underline"
            >
              {expert.website} ↗
            </a>
          )}
        </div>

        <p className="text-xs text-ink-50 mt-6">{t('listedDisclaimer')}</p>
      </div>
    </article>
  )
}
