import { Link } from '@/i18n/navigation'
import { Clock, MapPin } from 'lucide-react'
import { MediaImage } from './MediaImage'
import { forwardArrow } from '@/i18n/routing'
import { homeCopy } from '@/components/home/copy'
import type { EventDoc, ResolvedMedia } from '@/types/payload'

type Props = {
  event: EventDoc
  locale: string
}

// Figma 7.png tints the header band of each card in a rotating pastel (blue / green / sand).
const BAND_TINTS = ['bg-[#E7EEF7]', 'bg-[#EAF2EA]', 'bg-[#F5EEE8]']
const PILL_TINTS = [
  'bg-[#DCE7F5] text-brand-blue',
  'bg-brand-green-lt text-brand-green-dk',
  'bg-[#F0E4D8] text-[#8A5A2B]',
]

const INTL_LOCALE: Record<string, string> = { de: 'de-AT', ar: 'ar', en: 'en-GB' }

function dateParts(iso: string | null | undefined, locale: string): { day: string; month: string } | null {
  if (!iso) return null
  try {
    const d = new Date(iso)
    const loc = INTL_LOCALE[locale] ?? 'de-AT'
    return {
      day: new Intl.DateTimeFormat(loc, { day: 'numeric' }).format(d),
      month: new Intl.DateTimeFormat(loc, { month: 'short' }).format(d),
    }
  } catch {
    return null
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
  const copy = homeCopy(locale)
  const slug = event.slug ?? ''
  const title = event.title ?? '—'
  const coverImage = event.coverImage as ResolvedMedia | null | undefined
  const hasCover = !!coverImage && typeof coverImage !== 'string'
  const parts = dateParts(event.startDate, locale)
  const time = formatTime(event.startDate)
  const tint = (Number.parseInt(String(event.id), 10) || 0) % BAND_TINTS.length
  const category = event.category && typeof event.category !== 'string' ? event.category.name : null

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-[18px] border border-border bg-surface transition-shadow hover:shadow-lg">
      <div className={`relative flex items-start justify-between gap-3 p-5 ${hasCover ? 'h-44' : `h-[112px] ${BAND_TINTS[tint]}`}`}>
        {hasCover && (
          <div className="absolute inset-0">
            <MediaImage media={coverImage as ResolvedMedia} size="card" fill />
          </div>
        )}
        {parts && (
          <time
            dateTime={event.startDate ?? undefined}
            className="relative z-10 flex min-w-[64px] flex-col items-center rounded-xl bg-surface px-3 py-2 text-center shadow-sm"
          >
            <span className="text-2xl font-bold leading-none text-ink">{parts.day}</span>
            <span className="mt-1 text-xs text-ink-50">{parts.month}</span>
          </time>
        )}
        {category && (
          <span className={`relative z-10 rounded-md px-2.5 py-1 text-xs font-medium ${PILL_TINTS[tint]}`}>{category}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <h3 className="text-lg font-bold leading-snug text-ink line-clamp-2">
          <Link href={{ pathname: '/events/[slug]', params: { slug } }} className="hover:text-brand-blue transition-colors">
            {title}
          </Link>
        </h3>

        <div className="flex flex-col gap-2 text-sm text-ink-70">
          {event.locationName && (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-ink-50" aria-hidden="true" />
              {event.locationName}
            </span>
          )}
          {(time || event.isFree !== false || event.isOnline) && (
            <span className="flex flex-wrap items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-ink-50" aria-hidden="true" />
              {[time, event.isOnline ? copy.online : null, event.isFree !== false ? copy.free : null]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
        </div>

        <Link
          href={{ pathname: '/events/[slug]', params: { slug } }}
          className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-xl bg-brand-green px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-dk"
          aria-label={title}
        >
          {copy.details}
          <span aria-hidden="true">{forwardArrow(locale)}</span>
        </Link>
      </div>
    </article>
  )
}
