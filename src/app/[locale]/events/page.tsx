import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EventCard } from '@/components/ui/EventCard'
import { getUpcomingEvents } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

export default async function EventsIndexPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('events')
  const result = await getUpcomingEvents(locale, 12)
  const events = result.docs

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} />
      {events.length === 0 ? (
        <p className="text-ink-50">{t('noUpcoming')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
