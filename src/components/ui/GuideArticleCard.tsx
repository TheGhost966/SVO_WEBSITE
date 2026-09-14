import { Link } from '@/i18n/navigation'
import { MediaImage } from './MediaImage'
import { forwardArrow } from '@/i18n/routing'
import type { GuideArticleDoc, ResolvedMedia } from '@/types/payload'

type Props = {
  article: GuideArticleDoc
  topicSlug: string
  locale: string
}

export function GuideArticleCard({ article, topicSlug, locale }: Props) {
  const slug = article.slug ?? ''
  const title = article.title ?? '—'
  const coverImage = article.coverImage as ResolvedMedia | null | undefined
  const href = { pathname: '/guide/[topic]/[article]' as const, params: { topic: topicSlug, article: slug } }

  return (
    <article className="bg-surface rounded-card border border-border overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      {coverImage && typeof coverImage !== 'string' && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={coverImage} size="card" fill />
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="font-semibold text-ink text-base leading-snug line-clamp-2">
          <Link href={href} className="hover:text-brand-blue transition-colors">
            {title}
          </Link>
        </h3>

        {article.excerpt && (
          <p className="text-sm text-ink-70 line-clamp-3 flex-1">{article.excerpt}</p>
        )}

        <Link
          href={href}
          className="text-sm font-semibold text-brand-blue hover:text-brand-navy transition-colors mt-auto"
          aria-label={title}
        >
          {locale === 'ar' ? 'اقرأ المزيد' : locale === 'en' ? 'Read more' : 'Mehr lesen'} {forwardArrow(locale)}
        </Link>
      </div>
    </article>
  )
}
