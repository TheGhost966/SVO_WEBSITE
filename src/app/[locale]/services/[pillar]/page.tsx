import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Icon } from '@/components/ui/Icon'
import { MediaImage } from '@/components/ui/MediaImage'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { breadcrumbSchema } from '@/lib/jsonld'
import {
  getPillarBySlug,
  getServicesByPillar,
  getPillarAllLocaleSlugs,
} from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import type { ResolvedMedia, ServiceDoc } from '@/types/payload'

const SERVICES_BASE: Record<string, string> = {
  de: '/de/leistungen',
  ar: '/ar/services',
  en: '/en/services',
}

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const SERVICES_LABEL: Record<string, string> = { de: 'Leistungen', ar: 'خدمات', en: 'Services' }

type Props = { params: Promise<{ locale: string; pillar: string }> }

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const params: { locale: string; pillar: string }[] = []
    for (const locale of ['de', 'ar', 'en'] as const) {
      const result = await payload.find({
        collection: 'service-pillars',
        locale,
        depth: 0,
        limit: 50,
      })
      for (const doc of result.docs) {
        const slug = (doc as { slug?: unknown }).slug
        if (typeof slug === 'string') params.push({ locale, pillar: slug })
      }
    }
    return params
  } catch {
    return []
  }
}

export const dynamicParams = true

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, pillar: pillarSlug } = await params
  const pillar = await getPillarBySlug(pillarSlug, locale)
  if (!pillar) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = SERVICES_BASE[locale] ?? SERVICES_BASE.de
  const slugsByLocale = await getPillarAllLocaleSlugs(pillar.id)

  const languages: Record<string, string> = {}
  for (const [loc, locSlug] of Object.entries(slugsByLocale)) {
    const locBase = SERVICES_BASE[loc]
    if (locBase && locSlug) languages[loc] = `${SERVER}${locBase}/${locSlug}`
  }

  return {
    title: pillar.title ?? undefined,
    description: pillar.description ?? undefined,
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${pillarSlug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PillarPage({ params }: Props) {
  const { locale, pillar: pillarSlug } = await params
  setRequestLocale(locale)

  const [pillar, services] = await Promise.all([
    getPillarBySlug(pillarSlug, locale),
    getServicesByPillar(pillarSlug, locale),
  ])

  if (!pillar) notFound()

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = SERVICES_BASE[locale] ?? SERVICES_BASE.de

  const crumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: SERVICES_LABEL[locale] ?? 'Services', url: `${SERVER}${base}` },
    { name: pillar.title ?? '', url: `${SERVER}${base}/${pillarSlug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbData) }} />

      {/* Pillar hero */}
      <div
        className="py-12 md:py-16"
        style={{
          backgroundColor: pillar.colourToken
            ? `color-mix(in srgb, var(${pillar.colourToken}) 8%, white)`
            : 'var(--color-brand-green-lt)',
        }}
      >
        <div
          className="mx-auto max-w-[1200px] flex items-center gap-6"
          style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
        >
          <div
            className="shrink-0 w-16 h-16 rounded-card-lg flex items-center justify-center"
            style={{
              backgroundColor: pillar.colourToken
                ? `color-mix(in srgb, var(${pillar.colourToken}) 20%, white)`
                : 'var(--color-brand-green-lt)',
              color: pillar.colourToken ? `var(${pillar.colourToken})` : 'var(--color-brand-green-dk)',
            }}
          >
            <Icon name={pillar.icon} className="w-8 h-8" />
          </div>
          <div>
            <Breadcrumb
              items={[
                { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
                { label: SERVICES_LABEL[locale] ?? 'Services', href: '/services' },
                { label: pillar.title ?? '' },
              ]}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{pillar.title}</h1>
            {pillar.description && (
              <p className="mt-2 text-ink-70 max-w-2xl">{pillar.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Services list */}
      <div
        className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {services.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-ink-50 mb-2">
              {locale === 'ar'
                ? 'لا توجد خدمات متاحة في هذا المجال حاليًا.'
                : locale === 'en'
                  ? 'No services in this area yet.'
                  : 'In diesem Bereich sind noch keine Leistungen eingetragen.'}
            </p>
            <p className="text-xs text-ink-50">
              [{locale.toUpperCase()}] Inhalte folgen nach Redaktionsfreigabe.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                pillarSlug={pillarSlug}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  pillarSlug,
  locale,
}: {
  service: ServiceDoc
  pillarSlug: string
  locale: string
}) {
  const image = service.image && typeof service.image !== 'string'
    ? (service.image as ResolvedMedia)
    : null

  return (
    <Link
      href={{ pathname: '/services/[pillar]/[service]', params: { pillar: pillarSlug, service: service.slug ?? service.id ?? '' } }}
      className="group bg-surface rounded-card border border-border overflow-hidden flex flex-col hover:border-brand-blue hover:shadow-md transition-all"
    >
      {image ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={image} size="card" fill />
        </div>
      ) : (
        <div className="h-2 bg-brand-green-lt" aria-hidden="true" />
      )}

      <div className="flex-1 p-5 flex flex-col gap-2">
        {service.icon && (
          <Icon name={service.icon} className="w-5 h-5 text-brand-blue mb-1" />
        )}
        <h2 className="font-semibold text-ink group-hover:text-brand-blue transition-colors leading-snug">
          {service.title}
        </h2>
        {service.summary && (
          <p className="text-sm text-ink-70 line-clamp-3 flex-1">{service.summary}</p>
        )}
        <span className="mt-2 text-sm font-semibold text-brand-blue">
          {locale === 'ar' ? 'اعرف المزيد' : locale === 'en' ? 'Learn more' : 'Mehr erfahren'} →
        </span>
      </div>
    </Link>
  )
}
