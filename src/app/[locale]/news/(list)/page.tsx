import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { NewsCard } from '@/components/ui/NewsCard'
import { CategoryFilter } from '@/components/ui/CategoryFilter'
import { Pagination } from '@/components/ui/Pagination'
import { getNewsPage, getNewsCategories } from '@/lib/queries'

// Locale → URL path for the news index (used in pagination and category filter links)
const NEWS_PATHS: Record<string, string> = {
  de: '/de/nachrichten',
  ar: '/ar/news',
  en: '/en/news',
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; cat?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'news' })
  return {
    title: t('title'),
    alternates: {
      languages: {
        de: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/de/nachrichten`,
        ar: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/ar/news`,
        en: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/en/news`,
      },
    },
  }
}

export default async function NewsIndexPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page: pageParam = '1', cat } = await searchParams
  setRequestLocale(locale)

  const t = await getTranslations('news')
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1)
  const basePath = NEWS_PATHS[locale] ?? NEWS_PATHS.de

  // Parallel fetch: articles + categories
  const [result, categories] = await Promise.all([
    getNewsPage(locale, currentPage, cat),
    getNewsCategories(),
  ])

  const articles = result.docs
  const totalDocs = result.totalDocs
  const LIMIT = 9
  const totalPages = Math.ceil(totalDocs / LIMIT)
  const hasNextPage = result.hasNextPage

  function makePageUrl(p: number): string {
    const sp = new URLSearchParams()
    if (p > 1) sp.set('page', String(p))
    if (cat) sp.set('cat', cat)
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} />

      {/* Category filter — only shown when there are categories */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          currentSlug={cat}
          allLabel={t('filterAll')}
          basePath={basePath}
        />
      )}

      {/* Results */}
      {articles.length === 0 ? (
        <p className="text-ink-50 py-12 text-center">{t('noResults')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={currentPage}
        hasNextPage={hasNextPage}
        totalPages={totalPages}
        makeUrl={makePageUrl}
        locale={locale}
      />
    </div>
  )
}
