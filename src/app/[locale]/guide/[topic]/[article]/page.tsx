import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { MediaImage } from '@/components/ui/MediaImage'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FallbackNotice } from '@/components/ui/FallbackNotice'
import { GuideDisclaimer } from '@/components/ui/GuideDisclaimer'
import { Link } from '@/i18n/navigation'
import { buildMetadata } from '@/lib/seo'
import { guideArticleSchema, breadcrumbSchema } from '@/lib/jsonld'
import {
  getGuideArticleBySlug,
  getGuideTopicBySlug,
  getGuideArticlesByTopic,
} from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import type { ResolvedMedia } from '@/types/payload'
import { JsonLd } from '@/components/ui/JsonLd'

const GUIDE_BASE: Record<string, string> = {
  de: '/de/oesterreich-guide',
  ar: '/ar/guide',
  en: '/en/guide',
}

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const GUIDE_LABEL: Record<string, string> = { de: 'Österreich-Guide', ar: 'دليل النمسا', en: 'Austria Guide' }
const LAST_REVIEWED_LABEL: Record<string, string> = { de: 'Stand', ar: 'آخر تحديث', en: 'Last reviewed' }
const OFFICIAL_SOURCE_LABEL: Record<string, string> = {
  de: 'Offizielle Quelle',
  ar: 'المصدر الرسمي',
  en: 'Official source',
}

type Props = { params: Promise<{ locale: string; topic: string; article: string }> }

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
      collection: 'guide-articles',
      where: { reviewStatus: { equals: 'published' } },
      depth: 1,
      limit: 500,
    })
    const pairs: { topic: string; article: string }[] = []
    for (const doc of result.docs) {
      const d = doc as { slug?: unknown; topic?: { slug?: unknown } | unknown }
      const articleSlug = d.slug
      const topicSlug = d.topic && typeof d.topic === 'object' ? (d.topic as { slug?: unknown }).slug : undefined
      if (typeof articleSlug === 'string' && typeof topicSlug === 'string') {
        pairs.push({ topic: topicSlug, article: articleSlug })
      }
    }
    return (['de', 'ar', 'en'] as const).flatMap((locale) =>
      pairs.map(({ topic, article }) => ({ locale, topic, article })),
    )
  } catch {
    return []
  }
}

export const dynamicParams = true

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, topic: topicSlug, article: articleSlug } = await params
  const article = await getGuideArticleBySlug(topicSlug, articleSlug, locale)
  if (!article) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = GUIDE_BASE[locale] ?? GUIDE_BASE.de

  // slug is unlocalized (DECISIONS.md "Unlocalized slugs") — same segments for every locale.
  const languages: Record<string, string> = {}
  for (const loc of ['de', 'ar', 'en'] as const) {
    const locBase = GUIDE_BASE[loc]
    if (locBase) languages[loc] = `${SERVER}${locBase}/${topicSlug}/${articleSlug}`
  }

  const meta = buildMetadata({ doc: article, locale, serverUrl: SERVER })

  return {
    ...meta,
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${topicSlug}/${articleSlug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function GuideArticlePage({ params }: Props) {
  const { locale, topic: topicSlug, article: articleSlug } = await params
  setRequestLocale(locale)

  const [article, topic] = await Promise.all([
    getGuideArticleBySlug(topicSlug, articleSlug, locale),
    getGuideTopicBySlug(topicSlug, locale),
  ])

  if (!article) notFound()

  // Related articles from the same topic, excluding current
  const siblingResult = await getGuideArticlesByTopic(topicSlug, locale, 1)
  const related = siblingResult.docs.filter((a) => a.id !== article.id).slice(0, 3)

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = GUIDE_BASE[locale] ?? GUIDE_BASE.de
  const articleUrl = `${SERVER}${base}/${topicSlug}/${articleSlug}`

  const image =
    article.coverImage && typeof article.coverImage !== 'string' ? (article.coverImage as ResolvedMedia) : null

  const jsonLd = guideArticleSchema({
    title: article.title ?? '',
    description: article.excerpt,
    imageUrl: image?.sizes?.hero?.url ?? image?.url,
    dateModified: article.lastReviewedAt,
    url: articleUrl,
    locale,
  })
  const crumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: GUIDE_LABEL[locale] ?? 'Guide', url: `${SERVER}${base}` },
    { name: topic?.title ?? '', url: `${SERVER}${base}/${topicSlug}` },
    { name: article.title ?? '', url: articleUrl },
  ])

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={crumbData} />

      <article>
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
                { label: GUIDE_LABEL[locale] ?? 'Guide', href: '/guide' },
                {
                  label: topic?.title ?? '',
                  href: { pathname: '/guide/[topic]', params: { topic: topicSlug } },
                },
                { label: article.title ?? '' },
              ]}
            />

            {article._isFallback && (
              <div className="mb-6">
                <FallbackNotice locale={locale} />
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-4">{article.title}</h1>

            {/* Content freshness (BRIEF-AMENDMENT-01 §2.6) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-50 border-b border-border pb-8 mb-8">
              {article.lastReviewedAt && (
                <span>
                  {LAST_REVIEWED_LABEL[locale] ?? LAST_REVIEWED_LABEL.de}: {formatDate(article.lastReviewedAt, locale)}
                </span>
              )}
              {article.officialSourceUrl && (
                <a
                  href={article.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-brand-blue hover:text-brand-navy transition-colors underline"
                >
                  {OFFICIAL_SOURCE_LABEL[locale] ?? OFFICIAL_SOURCE_LABEL.de} ↗
                </a>
              )}
            </div>

            <GuideDisclaimer locale={locale} />

            <LexicalContent content={article.body} />
          </div>
        </div>

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
                  ? `مقالات أخرى — ${topic?.title ?? ''}`
                  : locale === 'en'
                    ? `More in ${topic?.title ?? ''}`
                    : `Weitere Artikel — ${topic?.title ?? ''}`}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <Link
                    key={a.id}
                    href={{
                      pathname: '/guide/[topic]/[article]',
                      params: { topic: topicSlug, article: a.slug ?? a.id },
                    }}
                    className="group bg-surface rounded-card border border-border p-5 hover:border-brand-blue hover:shadow-sm transition-all"
                  >
                    <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors text-sm">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="mt-1 text-xs text-ink-70 line-clamp-2">{a.excerpt}</p>
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
