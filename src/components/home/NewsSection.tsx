import { Link } from '@/i18n/navigation'
import { NewsCard } from '@/components/ui/NewsCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardArrow } from '@/i18n/routing'
import type { NewsDoc } from '@/types/payload'
import { HomeSectionShell } from './shared'

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
      <div className="flex items-end justify-between gap-4 mb-8">
        <SectionHeader id="news-heading" title={t('latestNews')} />
        <Link href="/news" className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0">
          {t('allNews')} {forwardArrow(locale)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((article) => (
          <NewsCard key={article.id} article={article} locale={locale} />
        ))}
      </div>
    </HomeSectionShell>
  )
}
