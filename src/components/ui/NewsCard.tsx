import { Link } from '@/i18n/navigation'
import { CalendarDays } from 'lucide-react'
import { MediaImage } from './MediaImage'
import { forwardArrow } from '@/i18n/routing'
import { homeCopy } from '@/components/home/copy'
import type { NewsDoc, ResolvedMedia } from '@/types/payload'

type Props = {
  article: NewsDoc
  locale: string
}

// Figma 9.png: articles without a photo get a rotating brand gradient (blue / green / brown).
const GRADIENTS = [
  'linear-gradient(135deg, #062E57 0%, #0B4EA2 100%)',
  'linear-gradient(135deg, #22591D 0%, #3F8F37 100%)',
  'linear-gradient(135deg, #5E3A17 0%, #8A5A2B 100%)',
]

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
  const copy = homeCopy(locale)
  const slug = article.slug ?? ''
  const title = article.title ?? '—'
  const coverImage = article.coverImage as ResolvedMedia | null | undefined
  const hasCover = !!coverImage && typeof coverImage !== 'string'
  const gradient = GRADIENTS[(Number.parseInt(String(article.id), 10) || 0) % GRADIENTS.length]
  const category = article.category && typeof article.category !== 'string' ? article.category.name : null

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-surface transition-shadow hover:shadow-lg">
      <div className="relative h-44 md:h-[168px]" style={hasCover ? undefined : { background: gradient }}>
        {hasCover && <MediaImage media={coverImage as ResolvedMedia} size="card" fill />}
        {category && (
          <span className="absolute end-4 top-4 rounded-md bg-white/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <h3 className="text-lg font-bold leading-snug text-ink line-clamp-2">
          <Link href={{ pathname: '/news/[slug]', params: { slug } }} className="hover:text-brand-blue transition-colors">
            {title}
          </Link>
        </h3>

        {article.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-ink-70">{article.excerpt}</p>}

        {article.publishedAt && (
          <p className="flex items-center gap-1.5 text-xs text-ink-50">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time>
          </p>
        )}

        <Link
          href={{ pathname: '/news/[slug]', params: { slug } }}
          className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-navy"
          aria-label={title}
        >
          {copy.readMore}
          <span aria-hidden="true">{forwardArrow(locale)}</span>
        </Link>
      </div>
    </article>
  )
}
