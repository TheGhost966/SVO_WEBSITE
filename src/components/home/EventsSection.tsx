import { Link } from '@/i18n/navigation'
import { EventCard } from '@/components/ui/EventCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardArrow } from '@/i18n/routing'
import type { EventDoc } from '@/types/payload'
import { HomeSectionShell } from './shared'

export function EventsSection({
  locale,
  events,
  t,
}: {
  locale: string
  events: EventDoc[]
  t: (key: string) => string
}) {
  if (events.length === 0) return null

  return (
    <HomeSectionShell id="events-heading" bg="bg-surface">
      <div className="flex items-end justify-between gap-4 mb-8">
        <SectionHeader id="events-heading" title={t('upcomingEvents')} />
        <Link href="/events" className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0">
          {t('allEvents')} {forwardArrow(locale)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} locale={locale} />
        ))}
      </div>
    </HomeSectionShell>
  )
}
