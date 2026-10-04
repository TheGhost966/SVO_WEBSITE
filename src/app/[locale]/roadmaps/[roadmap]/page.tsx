import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FallbackNotice } from '@/components/ui/FallbackNotice'
import { GuideDisclaimer } from '@/components/ui/GuideDisclaimer'
import { Link } from '@/i18n/navigation'
import { buildMetadata } from '@/lib/seo'
import { roadmapSchema, breadcrumbSchema } from '@/lib/jsonld'
import { getRoadmapBySlug } from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import type { RoadmapStep } from '@/types/payload'
import { JsonLd } from '@/components/ui/JsonLd'

const ROADMAPS_BASE: Record<string, string> = {
  de: '/de/anleitungen',
  ar: '/ar/roadmaps',
  en: '/en/roadmaps',
}

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const ROADMAPS_LABEL: Record<string, string> = { de: 'Anleitungen', ar: 'خرائط الطريق', en: 'Roadmaps' }
const LAST_REVIEWED_LABEL: Record<string, string> = { de: 'Stand', ar: 'آخر تحديث', en: 'Last reviewed' }
const OFFICIAL_SOURCE_LABEL: Record<string, string> = {
  de: 'Offizielle Quelle',
  ar: 'المصدر الرسمي',
  en: 'Official source',
}

type Props = { params: Promise<{ locale: string; roadmap: string }> }

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    // slug is unlocalized — one fetch covers every locale variant.
    const result = await payload.find({
      collection: 'roadmaps',
      where: { reviewStatus: { equals: 'published' } },
      depth: 0,
      limit: 500,
    })
    const slugs = result.docs
      .map((doc) => (doc as { slug?: unknown }).slug)
      .filter((slug): slug is string => typeof slug === 'string')
    return (['de', 'ar', 'en'] as const).flatMap((locale) =>
      slugs.map((roadmap) => ({ locale, roadmap })),
    )
  } catch {
    return []
  }
}

export const dynamicParams = true

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, roadmap: slug } = await params
  const roadmap = await getRoadmapBySlug(slug, locale)
  if (!roadmap) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = ROADMAPS_BASE[locale] ?? ROADMAPS_BASE.de

  // slug is unlocalized (DECISIONS.md "Unlocalized slugs") — same segment for every locale.
  const languages: Record<string, string> = {}
  for (const loc of ['de', 'ar', 'en'] as const) {
    const locBase = ROADMAPS_BASE[loc]
    if (locBase) languages[loc] = `${SERVER}${locBase}/${slug}`
  }

  const meta = buildMetadata({ doc: roadmap, locale, serverUrl: SERVER })

  return {
    ...meta,
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${slug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function RoadmapPage({ params }: Props) {
  const { locale, roadmap: slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('roadmaps')

  const roadmap = await getRoadmapBySlug(slug, locale)
  if (!roadmap) notFound()

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = ROADMAPS_BASE[locale] ?? ROADMAPS_BASE.de
  const roadmapUrl = `${SERVER}${base}/${slug}`
  const steps: RoadmapStep[] = roadmap.steps ?? []

  const jsonLd = roadmapSchema({
    title: roadmap.title ?? '',
    description: roadmap.description,
    dateModified: roadmap.lastReviewedAt,
    url: roadmapUrl,
    locale,
    steps: steps.map((s) => ({ name: s.title ?? '', text: s.description ?? '' })),
  })
  const crumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: ROADMAPS_LABEL[locale] ?? 'Roadmaps', url: `${SERVER}${base}` },
    { name: roadmap.title ?? '', url: roadmapUrl },
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbData} />

      <article
        className="mx-auto max-w-[1200px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        <div className="py-10 md:py-14 max-w-3xl">
          <Breadcrumb
            items={[
              { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
              { label: ROADMAPS_LABEL[locale] ?? 'Roadmaps', href: '/roadmaps' },
              { label: roadmap.title ?? '' },
            ]}
          />

          {roadmap._isFallback && (
            <div className="mb-6">
              <FallbackNotice locale={locale} />
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-4">{roadmap.title}</h1>

          {roadmap.description && (
            <p className="text-ink-70 text-lg mb-4">{roadmap.description}</p>
          )}

          {/* Content freshness (BRIEF-AMENDMENT-01 §2.6) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-50 border-b border-border pb-8 mb-8">
            {roadmap.lastReviewedAt && (
              <span>
                {LAST_REVIEWED_LABEL[locale] ?? LAST_REVIEWED_LABEL.de}: {formatDate(roadmap.lastReviewedAt, locale)}
              </span>
            )}
            {roadmap.officialSourceUrl && (
              <a
                href={roadmap.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-brand-blue hover:text-brand-navy transition-colors underline"
              >
                {OFFICIAL_SOURCE_LABEL[locale] ?? OFFICIAL_SOURCE_LABEL.de} ↗
              </a>
            )}
          </div>

          <GuideDisclaimer locale={locale} />

          <ol className="flex flex-col gap-6">
            {steps.map((step, i) => (
              <li key={step.id ?? i} className="bg-surface rounded-card border border-border p-6">
                <div className="flex items-start gap-4">
                  <span
                    className="shrink-0 w-8 h-8 rounded-full bg-brand-green-lt text-brand-green-dk font-bold flex items-center justify-center text-sm"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-ink text-lg mb-2">
                      <span className="sr-only">{t('step')} {i + 1}: </span>
                      {step.title}
                    </h2>
                    {step.description && (
                      <p className="text-ink-70 text-sm mb-3 whitespace-pre-line">{step.description}</p>
                    )}

                    <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                      {step.responsibleAuthority && (
                        <div>
                          <dt className="font-semibold text-ink-70">{t('responsibleAuthority')}</dt>
                          <dd className="text-ink">{step.responsibleAuthority}</dd>
                        </div>
                      )}
                      {step.timing && (
                        <div>
                          <dt className="font-semibold text-ink-70">{t('timing')}</dt>
                          <dd className="text-ink">{step.timing}</dd>
                        </div>
                      )}
                    </dl>

                    {step.requiredDocuments && step.requiredDocuments.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold text-ink-70 text-sm mb-1">{t('requiredDocuments')}</p>
                        <ul className="list-disc list-inside text-sm text-ink-70">
                          {step.requiredDocuments.map((doc, di) => (
                            <li key={doc.id ?? di}>{doc.document}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.linkedGuideArticle &&
                      typeof step.linkedGuideArticle === 'object' &&
                      step.linkedGuideArticle.slug && (
                        <p className="mt-3 text-sm">
                          <Link
                            href={{
                              pathname: '/guide/[topic]/[article]',
                              params: {
                                topic:
                                  typeof step.linkedGuideArticle.topic === 'object' && step.linkedGuideArticle.topic
                                    ? (step.linkedGuideArticle.topic.slug ?? '')
                                    : '',
                                article: step.linkedGuideArticle.slug,
                              },
                            }}
                            className="text-brand-blue hover:text-brand-navy transition-colors font-semibold"
                          >
                            {step.linkedGuideArticle.title}
                          </Link>
                        </p>
                      )}

                    {step.links && step.links.length > 0 && (
                      <div className="mt-3">
                        <p className="font-semibold text-ink-70 text-sm mb-1">{t('links')}</p>
                        <ul className="flex flex-col gap-1 text-sm">
                          {step.links.map((link, li) => (
                            <li key={li}>
                              <a
                                href={link.url ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="text-brand-blue hover:text-brand-navy transition-colors underline"
                              >
                                {link.label} ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </article>
    </>
  )
}
