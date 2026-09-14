import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Icon } from '@/components/ui/Icon'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { GuideArticleCard } from '@/components/ui/GuideArticleCard'
import { Pagination } from '@/components/ui/Pagination'
import { breadcrumbSchema } from '@/lib/jsonld'
import {
  getGuideTopicBySlug,
  getGuideArticlesByTopic,
  getGuideTopicAllLocaleSlugs,
} from '@/lib/queries'
import { getPayloadClient } from '@/lib/payload'

const GUIDE_BASE: Record<string, string> = {
  de: '/de/oesterreich-guide',
  ar: '/ar/guide',
  en: '/en/guide',
}

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const GUIDE_LABEL: Record<string, string> = { de: 'Österreich-Guide', ar: 'دليل النمسا', en: 'Austria Guide' }
const ARTICLES_LIMIT = 9

type Props = {
  params: Promise<{ locale: string; topic: string }>
  searchParams: Promise<{ page?: string }>
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const payload = await getPayloadClient()
    const params: { locale: string; topic: string }[] = []
    for (const locale of ['de', 'ar', 'en'] as const) {
      const result = await payload.find({
        collection: 'guide-topics',
        locale,
        depth: 0,
        limit: 50,
      })
      for (const doc of result.docs) {
        const slug = (doc as { slug?: unknown }).slug
        if (typeof slug === 'string') params.push({ locale, topic: slug })
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
  const { locale, topic: topicSlug } = await params
  const topic = await getGuideTopicBySlug(topicSlug, locale)
  if (!topic) return {}

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = GUIDE_BASE[locale] ?? GUIDE_BASE.de
  const slugsByLocale = await getGuideTopicAllLocaleSlugs(topic.id)

  const languages: Record<string, string> = {}
  for (const [loc, locSlug] of Object.entries(slugsByLocale)) {
    const locBase = GUIDE_BASE[loc]
    if (locBase && locSlug) languages[loc] = `${SERVER}${locBase}/${locSlug}`
  }

  return {
    title: topic.title ?? undefined,
    description: topic.description ?? undefined,
    alternates: {
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
      canonical: `${SERVER}${base}/${topicSlug}`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function GuideTopicPage({ params, searchParams }: Props) {
  const { locale, topic: topicSlug } = await params
  const { page: pageParam = '1' } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('guide')

  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1)

  const [topic, result] = await Promise.all([
    getGuideTopicBySlug(topicSlug, locale),
    getGuideArticlesByTopic(topicSlug, locale, currentPage),
  ])

  if (!topic) notFound()

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = GUIDE_BASE[locale] ?? GUIDE_BASE.de
  const basePath = `${base}/${topicSlug}`
  const articles = result.docs
  const totalPages = Math.ceil(result.totalDocs / ARTICLES_LIMIT)

  function makePageUrl(p: number): string {
    return p > 1 ? `${basePath}?page=${p}` : basePath
  }

  const crumbData = breadcrumbSchema([
    { name: HOME_LABEL[locale] ?? 'Home', url: `${SERVER}/${locale}` },
    { name: GUIDE_LABEL[locale] ?? 'Guide', url: `${SERVER}${base}` },
    { name: topic.title ?? '', url: `${SERVER}${basePath}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbData) }} />

      {/* Topic hero */}
      <div className="py-12 md:py-16" style={{ backgroundColor: 'var(--color-brand-green-lt)' }}>
        <div
          className="mx-auto max-w-[1200px] flex items-center gap-6"
          style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
        >
          <div
            className="shrink-0 w-16 h-16 rounded-card-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}
          >
            <Icon name={topic.icon} fallback="📘" className="w-8 h-8" />
          </div>
          <div>
            <Breadcrumb
              items={[
                { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
                { label: GUIDE_LABEL[locale] ?? 'Guide', href: '/guide' },
                { label: topic.title ?? '' },
              ]}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{topic.title}</h1>
            {topic.description && <p className="mt-2 text-ink-70 max-w-2xl">{topic.description}</p>}
          </div>
        </div>
      </div>

      {/* Articles list */}
      <div
        className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
        style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
      >
        {articles.length === 0 ? (
          <p className="text-ink-50 py-12 text-center">{t('noArticlesInTopic')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <GuideArticleCard key={article.id} article={article} topicSlug={topicSlug} locale={locale} />
            ))}
          </div>
        )}

        <Pagination
          page={currentPage}
          hasNextPage={result.hasNextPage}
          totalPages={totalPages}
          makeUrl={makePageUrl}
          locale={locale}
        />
      </div>
    </>
  )
}
