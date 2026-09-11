import { Link } from '@/i18n/navigation'
import { MediaImage } from './MediaImage'
import type { EventDoc, ResolvedMedia } from '@/types/payload'

type Props = {
  event: EventDoc
  locale: string
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    if (h === '00' && m === '00') return ''
    return `${h}:${m}`
  } catch {
    return ''
  }
}

export function EventCard({ event, locale }: Props) {
  const slug = event.slug ?? ''
  const title = event.title ?? '—'
  const coverImage = event.coverImage as ResolvedMedia | null | undefined
  const date = formatDate(event.startDate)
  const time = formatTime(event.startDate)

  return (
    <article className="bg-surface rounded-card border border-border overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      {/* Cover image */}
      {coverImage && typeof coverImage !== 'string' && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={coverImage} size="card" fill />
        </div>
      )}

      {/* Date badge — visible even without image */}
      {!coverImage && event.startDate && (
        <div className="bg-brand-blue text-white text-center py-3 px-4">
          <time className="text-sm font-semibold" dateTime={event.startDate ?? undefined}>{date}</time>
          {time && <span className="block text-xs text-white/70">{time} Uhr</span>}
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Meta chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {event.isOnline && (
            <span className="px-2 py-0.5 rounded-[6px] bg-brand-blue/10 text-brand-blue font-medium">
              {locale === 'ar' ? 'عبر الإنترنت' : locale === 'en' ? 'Online' : 'Online'}
            </span>
          )}
          {event.isFree !== false && (
            <span className="px-2 py-0.5 rounded-[6px] bg-brand-green-lt text-brand-green-dk font-medium">
              {locale === 'ar' ? 'مجاني' : locale === 'en' ? 'Free' : 'Kostenlos'}
            </span>
          )}
          {coverImage && date && (
            <time className="text-ink-50" dateTime={event.startDate ?? undefined}>{date}{time && ` · ${time}`}</time>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-ink text-base leading-snug line-clamp-2">
          <Link href={{ pathname: '/events/[slug]', params: { slug } }} className="hover:text-brand-blue transition-colors">
            {title}
          </Link>
        </h3>

        {/* Location */}
        {event.locationName && (
          <p className="text-sm text-ink-50 flex items-center gap-1.5">
            <span aria-hidden="true">📍</span>
            {event.locationName}
          </p>
        )}

        {/* Read more */}
        <Link
          href={{ pathname: '/events/[slug]', params: { slug } }}
          className="text-sm font-semibold text-brand-blue hover:text-brand-navy transition-colors mt-auto"
          aria-label={title}
        >
          {locale === 'ar' ? 'التفاصيل' : locale === 'en' ? 'Details' : 'Details'} →
        </Link>
      </div>
    </article>
  )
}
