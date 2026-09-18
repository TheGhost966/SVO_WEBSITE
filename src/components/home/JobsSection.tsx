import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/Icon'
import { forwardArrow } from '@/i18n/routing'
import { HomeSectionShell, ViewAllCard } from './shared'

type JobResourceLink = { id?: string; label?: string | null; url?: string | null; description?: string | null }

/**
 * BRIEF-AMENDMENT-02 §1: "The Jobs section reflects the curated-external-links reality already
 * shipped ... Style it like Figma's job cards; do not fabricate company/date/type data." No
 * `Jobs` collection exists (see DECISIONS.md "Jobs slice") — this teaser reads the same
 * `SiteSettings.jobResourceLinks` the plain `/jobs` page already reads, styled as cards.
 */
export function JobsSection({
  locale,
  links,
  t,
}: {
  locale: string
  links: JobResourceLink[]
  t: (key: string) => string
}) {
  if (links.length === 0) return null
  const shown = links.slice(0, 3)

  return (
    <HomeSectionShell id="jobs-heading" bg="bg-cream">
      <div className="flex items-end justify-between gap-4 mb-8">
        <SectionHeader id="jobs-heading" title={t('jobsHeading')} />
        <Link href="/jobs" className="text-sm font-semibold text-brand-blue hover:text-brand-navy shrink-0">
          {t('allJobs')} {forwardArrow(locale)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((link, i) => (
          <a
            key={link.id ?? i}
            href={link.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group bg-surface rounded-card border border-border p-6 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all"
          >
            <span
              className="w-12 h-12 rounded-card flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}
            >
              <Icon name="briefcase" className="w-6 h-6" />
            </span>
            <h3 className="font-semibold text-ink group-hover:text-brand-blue transition-colors">{link.label}</h3>
            {link.description && <p className="text-sm text-ink-70 line-clamp-2">{link.description}</p>}
          </a>
        ))}
        <ViewAllCard href="/jobs" label={t('allJobs')} locale={locale} />
      </div>
    </HomeSectionShell>
  )
}
