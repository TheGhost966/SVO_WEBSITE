import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/Icon'
import { forwardArrow } from '@/i18n/routing'
import type { GuideTopicDoc } from '@/types/payload'
import { HomeSectionShell, ViewAllCard } from './shared'

export function GuideSection({
  locale,
  topics,
  t,
}: {
  locale: string
  topics: GuideTopicDoc[]
  t: (key: string) => string
}) {
  if (topics.length === 0) return null
  const shown = topics.slice(0, 3)

  return (
    <HomeSectionShell id="guide-heading" bg="bg-surface">
      <div className="flex items-end justify-between gap-4 mb-8">
        <SectionHeader id="guide-heading" title={t('guideHeading')} />
        <Link href="/guide" className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0">
          {t('allGuide')} {forwardArrow(locale)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((topic) => (
          <Link
            key={topic.id}
            href={{ pathname: '/guide/[topic]', params: { topic: topic.slug ?? '' } }}
            className="group bg-cream rounded-card border border-border p-6 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all"
          >
            <span
              className="w-12 h-12 rounded-card flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}
            >
              <Icon name={topic.icon} fallback="🧭" className="w-6 h-6" />
            </span>
            <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors">{topic.title}</h3>
            {topic.description && <p className="text-sm text-ink-70 line-clamp-2">{topic.description}</p>}
          </Link>
        ))}
        <ViewAllCard href="/guide" label={t('allGuide')} locale={locale} />
      </div>
    </HomeSectionShell>
  )
}
