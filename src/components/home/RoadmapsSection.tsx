import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/Icon'
import { forwardArrow } from '@/i18n/routing'
import type { RoadmapDoc } from '@/types/payload'
import { HomeSectionShell, ViewAllCard } from './shared'

export function RoadmapsSection({
  locale,
  roadmaps,
  t,
}: {
  locale: string
  roadmaps: RoadmapDoc[]
  t: (key: string) => string
}) {
  if (roadmaps.length === 0) return null
  const shown = roadmaps.slice(0, 3)

  return (
    <HomeSectionShell id="roadmaps-heading" bg="bg-cream">
      <div className="flex items-end justify-between gap-4 mb-8">
        <SectionHeader id="roadmaps-heading" title={t('roadmapsHeading')} />
        <Link href="/roadmaps" className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0">
          {t('allRoadmaps')} {forwardArrow(locale)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((roadmap) => (
          <Link
            key={roadmap.id}
            href={{ pathname: '/roadmaps/[roadmap]', params: { roadmap: roadmap.slug ?? '' } }}
            className="group bg-surface rounded-card border border-border p-6 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all"
          >
            <span
              className="w-12 h-12 rounded-card flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}
            >
              <Icon name={roadmap.icon} fallback="🧭" className="w-6 h-6" />
            </span>
            <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors">{roadmap.title}</h3>
            {roadmap.description && <p className="text-sm text-ink-70 line-clamp-2">{roadmap.description}</p>}
          </Link>
        ))}
        <ViewAllCard href="/roadmaps" label={t('allRoadmaps')} locale={locale} />
      </div>
    </HomeSectionShell>
  )
}
