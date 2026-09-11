import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { NewsCard } from '@/components/ui/NewsCard'
import { getNewsPage } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string; cat?: string }> }

export default async function NewsIndexPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { page = '1', cat } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('news')

  const result = await getNewsPage(locale, parseInt(page), cat)
  const articles = result.docs

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} />
      {articles.length === 0 ? (
        <p className="text-ink-50">{t('noResults')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
