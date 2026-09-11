import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { MediaImage } from '@/components/ui/MediaImage'
import { getNewsBySlug } from '@/lib/queries'
import type { ResolvedMedia } from '@/types/payload'

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function NewsArticlePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const article = await getNewsBySlug(slug, locale)
  if (!article) notFound()

  const coverImage = article.coverImage as ResolvedMedia | null | undefined

  return (
    <article
      className="py-12 md:py-[84px] mx-auto max-w-[1200px] max-w-3xl"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      {coverImage && typeof coverImage !== 'string' && (
        <div className="rounded-card-lg overflow-hidden mb-8 aspect-[16/9] relative">
          <MediaImage media={coverImage} size="hero" fill priority />
        </div>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-4">
        {article.title}
      </h1>
      {article.publishedAt && (
        <p className="text-xs text-ink-50 mb-8">
          {new Intl.DateTimeFormat('de-AT', { dateStyle: 'long' }).format(new Date(article.publishedAt))}
        </p>
      )}
      <LexicalContent content={(article as any).body} />
    </article>
  )
}
