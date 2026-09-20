import { Link } from '@/i18n/navigation'
import { Icon } from '@/components/ui/Icon'
import type { GuideTopicDoc } from '@/types/payload'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

/**
 * Figma 4.png: cream section, four-column grid of compact horizontal tiles — green icon tile,
 * topic title, and a one-line muted descriptor. Shows every topic the query returns (the page
 * fetches up to 12, matching the Figma's 3×4 grid; only topics with a published article appear).
 */
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
  const copy = homeCopy(locale)

  return (
    <HomeSectionShell id="guide-heading" bg="bg-cream">
      <SectionHead
        id="guide-heading"
        eyebrow={copy.eyebrow.guide}
        title={t('guideHeading')}
        subtitle={copy.guideSubtitle}
        action={{ href: '/guide', label: t('allGuide') }}
        locale={locale}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={{ pathname: '/guide/[topic]', params: { topic: topic.slug ?? '' } }}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand-green hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green-lt text-brand-green-dk">
              <Icon name={topic.icon} fallback="🧭" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold leading-snug text-ink group-hover:text-brand-blue">{topic.title}</span>
              {topic.description && (
                <span className="mt-0.5 block truncate text-xs text-ink-50">{topic.description}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </HomeSectionShell>
  )
}
