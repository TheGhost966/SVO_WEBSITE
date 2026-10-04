import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { MediaImage } from '@/components/ui/MediaImage'
import { EventCard } from '@/components/ui/EventCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FallbackNotice } from '@/components/ui/FallbackNotice'
import { ButtonLink } from '@/components/ui/Button'
import { getEventBySlug, getUpcomingEvents } from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'
import { eventSchema, breadcrumbSchema } from '@/lib/jsonld'
import type { ResolvedMedia } from '@/types/payload'
import { JsonLd } from '@/components/ui/JsonLd'

const EVENT_BASE: Record<string, string> = {
  de: '/de/veranstaltungen',
  ar: '/ar/events',
  en: '/en/events',
}

const HOME_LABEL: Record<string, string> = {
  de: 'Startseite',
  ar: 'الرئيسية',
  en: 'Home',
}
const EVENTS_LABEL: Record<string, string> = {
  de: 'Veranstaltungen',
  ar: 'فعاليات',
  en: 'Events',
}

type Props = { params: Promise<{ locale: string; slug: string }> }

// ─── Austrian date helpers ────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-AT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

function fmtTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    const h = d.getHours()
    const m = d.getMinutes()
    // Only show time if it isn't midnight (i.e. time was actually set)
    if (h === 0 && m === 0) return null
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} Uhr`
  } catch {
    return null
  }
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const params: { locale: string; slug: string }[] = []
    for (const locale of ['de', 'ar', 'en'] as const) {
      const result = await payload.find({
        collection: 'events',
        where: { reviewStatus: { equals: 'published' } },
        locale,
        depth: 0,
        limit: 500,
      })
      for (const doc of result.docs) {
        const slug = (doc as { slug?: unknown }).slug
        if (slug && typeof slug === 'string') params.push({ locale, slug })
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
  const { locale, slug } = await params
  const event = await getEventBySlug(slug, locale)
  if (!event) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = EVENT_BASE[locale] ?? EVENT_BASE.de

  // Slug is unlocalized: every locale shares the one URL segment.
  const languages: Record<string, string> = {}
  for (const [loc, locBase] of Object.entries(EVENT_BASE)) {
    languages[loc] = `${SERVER}${locBase}/${slug}`
  }

  const coverImage =
    event.coverImage && typeof event.coverImage !== 'string'
      ? (event.coverImage as ResolvedMedia)
      : null
  const imageUrl = coverImage?.sizes?.hero?.url ?? coverImage?.url

  const meta = buildMetadata({ doc: event, locale, serverUrl: SERVER })

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'website',
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${slug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function EventDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [event, relatedResult] = await Promise.all([
    getEventBySlug(slug, locale),
    getUpcomingEvents(locale, 4),
  ])

  if (!event) notFound()

  const related = relatedResult.docs.filter((e) => e.id !== event.id).slice(0, 3)

  const coverImage =
    event.coverImage && typeof event.coverImage !== 'string'
      ? (event.coverImage as ResolvedMedia)
      : null
  const imageUrl = coverImage?.sizes?.hero?.url ?? coverImage?.url

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = EVENT_BASE[locale] ?? EVENT_BASE.de
  const eventUrl = `${SERVER}${base}/${slug}`

  const isPast = event.startDate ? new Date(event.startDate) < new Date() : false

  const jsonLd = eventSchema({
    title: event.title ?? '',
    imageUrl,
    startDate: event.startDate ?? '',
    endDate: event.endDate,
    locationName: event.locationName,
    address: event.address,
    isOnline: event.isOnline,
    isFree: event.isFree,
    url: eventUrl,
    locale,
  })

  const crumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: EVENTS_LABEL[locale] ?? 'Events', url: `${SERVER}${base}` },
    { name: event.title ?? '', url: eventUrl },
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbData} />

      <article>
        {/* Cover image */}
        {coverImage && (
          <div className="relative w-full aspect-[21/9] max-h-[480px] overflow-hidden bg-ink/10">
            <MediaImage media={coverImage} size="hero" fill priority />
          </div>
        )}

        <div
          className="mx-auto max-w-[1200px]"
          style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
        >
          <div className="py-10 md:py-14">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
                { label: EVENTS_LABEL[locale] ?? 'Events', href: '/events' },
                { label: event.title ?? '' },
              ]}
            />

            {/* Fallback notice */}
            {event._isFallback && (
              <div className="mb-6">
                <FallbackNotice locale={locale} />
              </div>
            )}

            <div className="grid md:grid-cols-[1fr_300px] gap-12 items-start">
              {/* Main content */}
              <div>
                {/* Category */}
                {event.category && typeof event.category !== 'string' && event.category.name && (
                  <span className="inline-block mb-4 px-3 py-1 rounded-[6px] bg-brand-green-lt text-brand-green-dk text-xs font-semibold">
                    {event.category.name}
                  </span>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-6">
                  {event.title}
                </h1>

                {/* Status badge — past event */}
                {isPast && (
                  <span className="inline-block mb-6 px-3 py-1 rounded-[6px] bg-ink-50/10 text-ink-50 text-xs font-medium">
                    {locale === 'ar' ? 'فعالية منتهية' : locale === 'en' ? 'Past event' : 'Vergangene Veranstaltung'}
                  </span>
                )}

                {/* Description */}
                <LexicalContent content={event.description} />
              </div>

              {/* Sidebar: date, location, registration */}
              <aside className="bg-cream rounded-card border border-border p-6 space-y-5 sticky top-24">
                {/* Date & time */}
                {event.startDate && (
                  <div>
                    <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'التاريخ والوقت' : locale === 'en' ? 'Date & time' : 'Datum & Uhrzeit'}
                    </p>
                    <p className="font-semibold text-ink text-sm">
                      {fmtDate(event.startDate, locale)}
                    </p>
                    {fmtTime(event.startDate) && (
                      <p className="text-sm text-ink-70">{fmtTime(event.startDate)}</p>
                    )}
                    {event.endDate && fmtDate(event.endDate, locale) !== fmtDate(event.startDate, locale) && (
                      <p className="text-sm text-ink-50 mt-0.5">
                        {locale === 'ar' ? 'حتى' : locale === 'en' ? 'Until' : 'bis'}{' '}
                        {fmtDate(event.endDate, locale)}
                      </p>
                    )}
                    {event.endDate && fmtTime(event.endDate) && (
                      <p className="text-sm text-ink-50">{fmtTime(event.endDate)}</p>
                    )}
                  </div>
                )}

                {/* Location */}
                {!event.isOnline && event.locationName && (
                  <div>
                    <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'المكان' : locale === 'en' ? 'Location' : 'Veranstaltungsort'}
                    </p>
                    <p className="font-semibold text-ink text-sm">{event.locationName}</p>
                    {event.address && (
                      <p className="text-sm text-ink-70">{event.address}</p>
                    )}
                  </div>
                )}

                {/* Online badge */}
                {event.isOnline && (
                  <div>
                    <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'النوع' : locale === 'en' ? 'Format' : 'Format'}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue">
                      <span aria-hidden="true">💻</span>
                      {locale === 'ar' ? 'عبر الإنترنت' : locale === 'en' ? 'Online event' : 'Online-Veranstaltung'}
                    </span>
                  </div>
                )}

                {/* Entry fee */}
                <div>
                  <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-1">
                    {locale === 'ar' ? 'رسوم الدخول' : locale === 'en' ? 'Entry' : 'Eintritt'}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-[6px] text-sm font-semibold ${
                    event.isFree !== false
                      ? 'bg-brand-green-lt text-brand-green-dk'
                      : 'bg-cream text-ink border border-border'
                  }`}>
                    {event.isFree !== false
                      ? (locale === 'ar' ? 'مجاني' : locale === 'en' ? 'Free entry' : 'Kostenlos')
                      : (locale === 'ar' ? 'مدفوع' : locale === 'en' ? 'Paid' : 'Kostenpflichtig')}
                  </span>
                </div>

                {/* Capacity (display only) */}
                {event.capacity && (
                  <div>
                    <p className="text-xs font-semibold text-ink-50 uppercase tracking-wider mb-1">
                      {locale === 'ar' ? 'الطاقة الاستيعابية' : locale === 'en' ? 'Capacity' : 'Kapazität'}
                    </p>
                    <p className="text-sm text-ink">{event.capacity}</p>
                  </div>
                )}

                {/* Registration CTA */}
                {event.registrationUrl && !isPast && (
                  <div className="pt-2">
                    <ButtonLink
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="primary"
                      size="md"
                      className="w-full justify-center"
                    >
                      {locale === 'ar' ? 'سجّل الآن' : locale === 'en' ? 'Register now' : 'Jetzt anmelden'}
                      <span aria-hidden="true" className="ms-1">↗</span>
                    </ButtonLink>
                    <p className="mt-2 text-xs text-ink-50 text-center">
                      {locale === 'ar'
                        ? 'سيتم توجيهك إلى موقع التسجيل الخارجي'
                        : locale === 'en'
                          ? 'You will be redirected to the external registration page'
                          : 'Sie werden zur externen Anmeldeseite weitergeleitet'}
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>

        {/* Related events */}
        {related.length > 0 && (
          <section className="border-t border-border bg-cream py-12 md:py-16">
            <div
              className="mx-auto max-w-[1200px]"
              style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
            >
              <h2 className="text-xl font-bold text-ink mb-6">
                {locale === 'ar'
                  ? 'فعاليات قادمة'
                  : locale === 'en'
                    ? 'More upcoming events'
                    : 'Weitere Veranstaltungen'}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((e) => (
                  <EventCard key={e.id} event={e} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  )
}
