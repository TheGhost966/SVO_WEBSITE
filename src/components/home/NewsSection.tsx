import { NewsCard } from '@/components/ui/NewsCard'
import type { NewsDoc } from '@/types/payload'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

export function NewsSection({
  locale,
  news,
  t,
}: {
  locale: string
  news: NewsDoc[]
  t: (key: string) => string
}) {
  if (news.length === 0) return null

  return (
    <HomeSectionShell id="news-heading" bg="bg-cream">
      <SectionHead
        id="news-heading"
        eyebrow={homeCopy(locale).eyebrow.news}
        title={t('latestNews')}
        subtitle={homeCopy(locale).newsSubtitle}
        action={{ href: '/news', label: t('allNews') }}
        locale={locale}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {news.map((article) => (
          <NewsCard key={article.id} article={article} locale={locale} />
        ))}
      </div>
    </HomeSectionShell>
  )
}
