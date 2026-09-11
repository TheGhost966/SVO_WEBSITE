import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { getPayloadClient } from '@/lib/payload'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { MediaImage } from '@/components/ui/MediaImage'
import type { EventDoc, ResolvedMedia } from '@/types/payload'

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function EventDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  let event: EventDoc | null = null
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'events',
      where: { and: [{ slug: { equals: slug } }, { reviewStatus: { equals: 'published' } }] },
      locale: locale as 'de' | 'ar' | 'en',
      depth: 3,
      limit: 1,
    })
    event = (result.docs[0] as unknown as EventDoc) ?? null
  } catch {
    notFound()
  }

  if (!event) notFound()

  const coverImage = event.coverImage as ResolvedMedia | null | undefined

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
      <h1 className="text-3xl md:text-4xl font-bold text-ink leading-tight mb-4">{event.title}</h1>
      {event.startDate && (
        <p className="text-sm text-ink-50 mb-2">
          {new Intl.DateTimeFormat('de-AT', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(event.startDate))}
        </p>
      )}
      {event.locationName && <p className="text-sm text-ink-50 mb-6">📍 {event.locationName}</p>}
      <LexicalContent content={(event as any).description} />
    </article>
  )
}
