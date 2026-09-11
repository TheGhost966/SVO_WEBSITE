import { Link } from '@/i18n/navigation'
import { MediaImage } from './MediaImage'
import type { NewsDoc, ResolvedMedia } from '@/types/payload'

type Props = {
  article: NewsDoc
  locale: string
}

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'de-AT' : locale === 'en' ? 'en-GB' : 'de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

export function NewsCard({ article, locale }: Props) {
  const slug = article.slug ?? ''
  const title = article.title ?? '—'
  const coverImage = article.coverImage as ResolvedMedia | null | undefined

  return (
    <article className="bg-surface rounded-card border border-border overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Cover image */}
      {coverImage && typeof coverImage !== 'string' && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={coverImage} size="card" fill />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Category + date */}
        <div className="flex items-center gap-2 text-xs text-ink-50 flex-wrap">
          {article.category && typeof article.category !== 'string' && article.category.name && (
            <span className="px-2 py-0.5 rounded-[6px] bg-brand-green-lt text-brand-green-dk font-medium">
              {article.category.name}
            </span>
          )}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-ink text-base leading-snug line-clamp-2">
          <Link href={{ pathname: '/news/[slug]', params: { slug } }} className="hover:text-brand-blue transition-colors">
            {title}
          </Link>
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-sm text-ink-70 line-clamp-3 flex-1">{article.excerpt}</p>
        )}

        {/* Read more */}
        <Link
          href={{ pathname: '/news/[slug]', params: { slug } }}
          className="text-sm font-semibold text-brand-blue hover:text-brand-navy transition-colors mt-auto"
          aria-label={title}
        >
          {locale === 'ar' ? 'اقرأ المزيد' : locale === 'en' ? 'Read more' : 'Mehr lesen'} →
        </Link>
      </div>
    </article>
  )
}
