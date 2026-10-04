import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { MediaImage } from '@/components/ui/MediaImage'
import { NewsCard } from '@/components/ui/NewsCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { FallbackNotice } from '@/components/ui/FallbackNotice'
import { getNewsBySlug, getLatestNews } from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'
import { buildMetadata } from '@/lib/seo'
import { newsArticleSchema, breadcrumbSchema } from '@/lib/jsonld'
import type { ResolvedMedia } from '@/types/payload'
import { JsonLd } from '@/components/ui/JsonLd'

// Locale → base URL path for news articles
const NEWS_BASE: Record<string, string> = {
  de: '/de/nachrichten',
  ar: '/ar/news',
  en: '/en/news',
}

// Locale → label for breadcrumb "News" crumb
const NEWS_LABEL: Record<string, string> = {
  de: 'Nachrichten',
  ar: 'أخبار',
  en: 'News',
}

const HOME_LABEL: Record<string, string> = {
  de: 'Startseite',
  ar: 'الرئيسية',
  en: 'Home',
}

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

// ─── Static params for ISR pre-rendering ─────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const params: { locale: string; slug: string }[] = []

    for (const locale of ['de', 'ar', 'en'] as const) {
      const result = await payload.find({
        collection: 'news',
        where: { reviewStatus: { equals: 'published' } },
        locale,
        depth: 0,
        limit: 500,
      })
      for (const doc of result.docs) {
        const slug = (doc as { slug?: unknown }).slug
        if (slug && typeof slug === 'string') {
          params.push({ locale, slug })
        }
      }
    }

    return params
  } catch {
    // Database not yet connected — ISR will handle on-demand rendering
    return []
  }
}

// Keep pages not in generateStaticParams alive via on-demand ISR
export const dynamicParams = true

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const article = await getNewsBySlug(slug, locale)
  if (!article) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = NEWS_BASE[locale] ?? NEWS_BASE.de

  // Slug is unlocalized: every locale shares the one URL segment.
  const languages: Record<string, string> = {}
  for (const [loc, locBase] of Object.entries(NEWS_BASE)) {
    languages[loc] = `${SERVER}${locBase}/${slug}`
  }

  const coverImage =
    article.coverImage && typeof article.coverImage !== 'string'
      ? (article.coverImage as ResolvedMedia)
      : null
  const imageUrl = coverImage?.sizes?.hero?.url ?? coverImage?.url

  const meta = buildMetadata({
    doc: article,
    locale,
    fallbackTitle: article.title ?? undefined,
    serverUrl: SERVER,
  })

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: 'article',
      publishedTime: article.publishedAt ?? undefined,
      authors: article.author ? [article.author] : ['SVÖ'],
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${slug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function NewsArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [article, relatedResult] = await Promise.all([
    getNewsBySlug(slug, locale),
    getLatestNews(locale, 4),
  ])

  if (!article) notFound()

  // Filter out the current article from "related"
  const related = relatedResult.docs.filter((a) => a.id !== article.id).slice(0, 3)

  const coverImage =
    article.coverImage && typeof article.coverImage !== 'string'
      ? (article.coverImage as ResolvedMedia)
      : null

  const imageUrl = coverImage?.sizes?.hero?.url ?? coverImage?.url
  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = NEWS_BASE[locale] ?? NEWS_BASE.de
  const articleUrl = `${SERVER}${base}/${slug}`

  // JSON-LD scripts
  const articleSchema = newsArticleSchema({
    title: article.title ?? '',
    description: article.excerpt,
    imageUrl,
    datePublished: article.publishedAt,
    author: article.author,
    url: articleUrl,
    locale,
  })

  const breadcrumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: NEWS_LABEL[locale] ?? 'News', url: `${SERVER}${base}` },
    { name: article.title ?? '', url: articleUrl },
  ])

  const isFallback = !!article._isFallback

  return (
    <>
      {/* Structured data */}
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbData} />

      <article>
        {/* Cover image — full-width above the fold */}
        {coverImage && (
          <div className="relative w-full aspect-[21/9] max-h-[520px] overflow-hidden bg-ink/10">
            <MediaImage media={coverImage} size="hero" fill priority />
          </div>
        )}

        <div
          className="mx-auto max-w-[1200px]"
          style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
        >
          <div className="py-10 md:py-14 max-w-3xl">
            {/* Breadcrumb */}
            <Breadcrumb
              items={[
                { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
                { label: NEWS_LABEL[locale] ?? 'News', href: '/news' },
                { label: article.title ?? '' },
              ]}
            />

            {/* Fallback language notice */}
            {isFallback && <div className="mb-6"><FallbackNotice locale={locale} /></div>}

            {/* Category */}
            {article.category && typeof article.category !== 'string' && article.category.name && (
              <span className="inline-block mb-4 px-3 py-1 rounded-[6px] bg-brand-green-lt text-brand-green-dk text-xs font-semibold">
                {article.category.name}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight">
              {article.title}
            </h1>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-ink-50 border-b border-border pb-6">
              {article.publishedAt && (
                <time dateTime={article.publishedAt}>
                  {new Intl.DateTimeFormat(
                    locale === 'en' ? 'en-GB' : 'de-AT',
                    { day: '2-digit', month: 'long', year: 'numeric' },
                  ).format(new Date(article.publishedAt))}
                </time>
              )}
              {article.author && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">✍️</span>
                  {article.author}
                </span>
              )}
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="mt-6 text-lg text-ink-70 font-medium leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Rich text body */}
            <div className="mt-8">
              <LexicalContent content={article.body} />
            </div>
          </div>
        </div>

        {/* Related news */}
        {related.length > 0 && (
          <section
            className="border-t border-border bg-cream py-12 md:py-16"
            aria-labelledby="related-heading"
          >
            <div
              className="mx-auto max-w-[1200px]"
              style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
            >
              <h2
                id="related-heading"
                className="text-xl font-bold text-ink mb-6"
              >
                {locale === 'ar' ? 'مقالات ذات صلة' : locale === 'en' ? 'Related articles' : 'Weitere Nachrichten'}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((a) => (
                  <NewsCard key={a.id} article={a} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  )
}
