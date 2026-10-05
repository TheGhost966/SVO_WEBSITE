import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EventCard } from '@/components/ui/EventCard'
import { CategoryFilter } from '@/components/ui/CategoryFilter'
import { Pagination } from '@/components/ui/Pagination'
import { SmartLink } from '@/components/ui/SmartLink'
import {
  getUpcomingEventsPaged,
  getPastEvents,
  getEventCategories,
} from '@/lib/queries'

const EVENT_PATHS: Record<string, string> = {
  de: '/de/veranstaltungen',
  ar: '/ar/events',
  en: '/en/events',
}

const VIEW_LABELS: Record<string, { upcoming: string; past: string }> = {
  de: { upcoming: 'Bevorstehend', past: 'Vergangen' },
  ar: { upcoming: 'القادمة', past: 'الماضية' },
  en: { upcoming: 'Upcoming', past: 'Past' },
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ view?: string; page?: string; cat?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'events' })
  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return {
    title: t('title'),
    alternates: {
      languages: {
        de: `${SERVER}/de/veranstaltungen`,
        ar: `${SERVER}/ar/events`,
        en: `${SERVER}/en/events`,
      },
    },
  }
}

export default async function EventsIndexPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { view = 'upcoming', page: pageParam = '1', cat } = await searchParams
  setRequestLocale(locale)

  const t = await getTranslations('events')
  const currentPage = Math.max(1, parseInt(pageParam, 10) || 1)
  const basePath = EVENT_PATHS[locale] ?? EVENT_PATHS.de
  const isPast = view === 'past'
  const labels = VIEW_LABELS[locale] ?? VIEW_LABELS.de

  const [result, categories] = await Promise.all([
    isPast
      ? getPastEvents(locale, currentPage, cat)
      : getUpcomingEventsPaged(locale, currentPage, cat),
    getEventCategories(locale),
  ])

  const events = result.docs
  const LIMIT = 9
  const totalPages = Math.ceil(result.totalDocs / LIMIT)

  function makePageUrl(p: number): string {
    const sp = new URLSearchParams()
    if (isPast) sp.set('view', 'past')
    if (p > 1) sp.set('page', String(p))
    if (cat) sp.set('cat', cat)
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  function makeViewUrl(v: 'upcoming' | 'past'): string {
    const sp = new URLSearchParams()
    if (v === 'past') sp.set('view', 'past')
    if (cat) sp.set('cat', cat)
    const qs = sp.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} />

      {/* Upcoming / Past tab toggle */}
      <div
        className="flex gap-1 p-1 bg-cream rounded-control border border-border w-fit mb-6"
        role="tablist"
        aria-label={t('title')}
      >
        {(['upcoming', 'past'] as const).map((v) => {
          const active = (v === 'past') === isPast
          return (
            <SmartLink
              key={v}
              href={makeViewUrl(v)}
              role="tab"
              aria-selected={active}
              className={`px-5 py-2 rounded-[8px] text-sm font-semibold transition-colors ${
                active
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-ink-70 hover:text-ink'
              }`}
            >
              {labels[v]}
            </SmartLink>
          )
        })}
      </div>

      {/* Category filter — extraParams preserves the current view tab */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          currentSlug={cat}
          allLabel={t('filterAll') || 'Alle'}
          basePath={basePath}
          extraParams={isPast ? { view: 'past' } : undefined}
        />
      )}

      {/* Grid */}
      {events.length === 0 ? (
        <p className="text-ink-50 py-16 text-center">
          {isPast ? t('noPast') : t('noUpcoming')}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      )}

      <Pagination
        page={currentPage}
        hasNextPage={result.hasNextPage}
        totalPages={totalPages}
        makeUrl={makePageUrl}
        locale={locale}
      />
    </div>
  )
}
