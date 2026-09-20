import { EventCard } from '@/components/ui/EventCard'
import type { EventDoc } from '@/types/payload'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

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
      <SectionHead
        id="events-heading"
        eyebrow={homeCopy(locale).eyebrow.events}
        title={t('upcomingEvents')}
        subtitle={homeCopy(locale).eventsSubtitle}
        action={{ href: '/events', label: t('allEvents') }}
        locale={locale}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} locale={locale} />
        ))}
      </div>
    </HomeSectionShell>
  )
}
