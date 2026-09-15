import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { MediaImage } from '@/components/ui/MediaImage'
import { Icon } from '@/components/ui/Icon'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FallbackNotice } from '@/components/ui/FallbackNotice'
import { Link } from '@/i18n/navigation'
import { buildMetadata } from '@/lib/seo'
import { serviceSchemaLD, breadcrumbSchema } from '@/lib/jsonld'
import {
  getServiceBySlug,
  getPillarBySlug,
  getServicesByPillar,
} from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import type { ResolvedMedia } from '@/types/payload'

const SERVICES_BASE: Record<string, string> = {
  de: '/de/leistungen',
  ar: '/ar/services',
  en: '/en/services',
}

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const SERVICES_LABEL: Record<string, string> = { de: 'Leistungen', ar: 'خدمات', en: 'Services' }

type Props = { params: Promise<{ locale: string; pillar: string; service: string }> }

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    // slug is unlocalized — one fetch covers every locale variant.
    const result = await payload.find({
      collection: 'services',
      where: { reviewStatus: { equals: 'published' } },
      depth: 1,
      limit: 500,
    })
    const pairs: { pillar: string; service: string }[] = []
    for (const doc of result.docs) {
      const d = doc as { slug?: unknown; pillar?: { slug?: unknown } | unknown }
      const serviceSlug = d.slug
      const pillarSlug = d.pillar && typeof d.pillar === 'object' ? (d.pillar as { slug?: unknown }).slug : undefined
      if (typeof serviceSlug === 'string' && typeof pillarSlug === 'string') {
        pairs.push({ pillar: pillarSlug, service: serviceSlug })
      }
    }
    return (['de', 'ar', 'en'] as const).flatMap((locale) =>
      pairs.map(({ pillar, service }) => ({ locale, pillar, service })),
    )
  } catch {
    return []
  }
}

export const dynamicParams = true

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, pillar: pillarSlug, service: serviceSlug } = await params
  const service = await getServiceBySlug(pillarSlug, serviceSlug, locale)
  if (!service) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = SERVICES_BASE[locale] ?? SERVICES_BASE.de

  // slug is unlocalized (DECISIONS.md "Unlocalized slugs") — same segments for every locale.
  const languages: Record<string, string> = {}
  for (const loc of ['de', 'ar', 'en'] as const) {
    const locBase = SERVICES_BASE[loc]
    if (locBase) languages[loc] = `${SERVER}${locBase}/${pillarSlug}/${serviceSlug}`
  }

  const meta = buildMetadata({ doc: service, locale, serverUrl: SERVER })

  return {
    ...meta,
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${pillarSlug}/${serviceSlug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, pillar: pillarSlug, service: serviceSlug } = await params
  setRequestLocale(locale)

  const [service, pillar] = await Promise.all([
    getServiceBySlug(pillarSlug, serviceSlug, locale),
    getPillarBySlug(pillarSlug, locale),
  ])

  if (!service) notFound()

  // Related services from the same pillar, excluding current
  const sibling = await getServicesByPillar(pillarSlug, locale)
  const related = sibling.filter((s) => s.id !== service.id).slice(0, 3)

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = SERVICES_BASE[locale] ?? SERVICES_BASE.de
  const serviceUrl = `${SERVER}${base}/${pillarSlug}/${serviceSlug}`

  const image =
    service.image && typeof service.image !== 'string' ? (service.image as ResolvedMedia) : null

  const jsonLd = serviceSchemaLD({ name: service.title ?? '', description: service.summary, url: serviceUrl })
  const crumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: SERVICES_LABEL[locale] ?? 'Services', url: `${SERVER}${base}` },
    { name: pillar?.title ?? '', url: `${SERVER}${base}/${pillarSlug}` },
    { name: service.title ?? '', url: serviceUrl },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbData) }} />

      <article>
        {/* Cover image */}
        {image && (
          <div className="relative w-full aspect-[21/9] max-h-[400px] overflow-hidden bg-ink/10">
            <MediaImage media={image} size="hero" fill priority />
          </div>
        )}

        <div
          className="mx-auto max-w-[1200px]"
          style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
        >
          <div className="py-10 md:py-14 max-w-3xl">
            <Breadcrumb
              items={[
                { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
                { label: SERVICES_LABEL[locale] ?? 'Services', href: '/services' },
                {
                  label: pillar?.title ?? '',
                  href: { pathname: '/services/[pillar]', params: { pillar: pillarSlug } },
                },
                { label: service.title ?? '' },
              ]}
            />

            {service._isFallback && (
              <div className="mb-6">
                <FallbackNotice locale={locale} />
              </div>
            )}

            {/* Icon + title */}
            <div className="flex items-start gap-4 mb-6">
              {service.icon && (
                <div
                  className="shrink-0 w-12 h-12 rounded-card flex items-center justify-center mt-1"
                  style={{
                    backgroundColor: 'var(--color-brand-green-lt)',
                    color: 'var(--color-brand-green-dk)',
                  }}
                >
                  <Icon name={service.icon} className="w-6 h-6" />
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight">{service.title}</h1>
            </div>

            {/* Summary */}
            {service.summary && (
              <p className="text-lg text-ink-70 font-medium leading-relaxed mb-8 border-b border-border pb-8">
                {service.summary}
              </p>
            )}

            {/* Target audience */}
            {service.targetAudience && (
              <div className="mb-8 p-5 rounded-card bg-brand-green-lt border border-brand-green/20">
                <p className="text-xs font-semibold text-brand-green-dk uppercase tracking-wider mb-2">
                  {locale === 'ar'
                    ? 'الفئة المستهدفة'
                    : locale === 'en'
                      ? 'Target audience'
                      : 'Zielgruppe'}
                </p>
                <p className="text-sm text-ink">{service.targetAudience}</p>
              </div>
            )}

            {/* Body */}
            <LexicalContent content={service.body} />
          </div>
        </div>

        {/* Related services within same pillar */}
        {related.length > 0 && (
          <section className="border-t border-border bg-cream py-12 md:py-16">
            <div
              className="mx-auto max-w-[1200px]"
              style={{
                paddingInlineStart: 'clamp(24px, 5vw, 120px)',
                paddingInlineEnd: 'clamp(24px, 5vw, 120px)',
              }}
            >
              <h2 className="text-xl font-bold text-ink mb-6">
                {locale === 'ar'
                  ? `خدمات أخرى — ${pillar?.title ?? ''}`
                  : locale === 'en'
                    ? `More in ${pillar?.title ?? ''}`
                    : `Weitere Leistungen — ${pillar?.title ?? ''}`}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((s) => (
                  <Link
                    key={s.id}
                    href={{
                      pathname: '/services/[pillar]/[service]',
                      params: { pillar: pillarSlug, service: s.slug ?? s.id },
                    }}
                    className="group bg-surface rounded-card border border-border p-5 hover:border-brand-blue hover:shadow-sm transition-all"
                  >
                    {s.icon && <Icon name={s.icon} className="w-5 h-5 text-brand-blue mb-2" />}
                    <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors text-sm">
                      {s.title}
                    </h3>
                    {s.summary && (
                      <p className="mt-1 text-xs text-ink-70 line-clamp-2">{s.summary}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  )
}
