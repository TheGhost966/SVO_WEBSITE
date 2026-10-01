import { Briefcase, ExternalLink } from 'lucide-react'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'
import { JobCard } from '@/components/ui/JobCard'
import type { JobDoc } from '@/types/payload'

type JobResourceLink = { id?: string; label?: string | null; url?: string | null; description?: string | null }

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Figma 6.png. Real postings from the `jobs` collection now back this teaser, so the frame's type
 * tag, employer, location and expiry date are actual fields rather than the invented values an
 * earlier pass refused to fake.
 *
 * The curated `SiteSettings.jobResourceLinks` rows stay as the fallback: with no live postings
 * the section still points people at AMS and the other portals instead of vanishing, which is
 * what an association with an intermittent board-run board actually looks like.
 */
export function JobsSection({
  locale,
  jobs,
  links,
  t,
}: {
  locale: string
  jobs: JobDoc[]
  links: JobResourceLink[]
  t: (key: string) => string
}) {
  if (jobs.length === 0 && links.length === 0) return null
  const copy = homeCopy(locale)
  const shownJobs = jobs.slice(0, 4)
  // Only pad with portal links when there are few real postings, so the list never reads as a
  // mix of "apply here" and "go look elsewhere" when there is plenty of the former.
  const shown = shownJobs.length >= 3 ? [] : links.slice(0, 4 - shownJobs.length)

  return (
    <HomeSectionShell id="jobs-heading" bg="bg-surface">
      <SectionHead
        id="jobs-heading"
        eyebrow={copy.eyebrow.jobs}
        title={t('jobsHeading')}
        subtitle={copy.jobsSubtitle}
        action={{ href: '/jobs', label: t('allJobs') }}
        locale={locale}
      />
      <ul className="flex flex-col gap-4">
        {shownJobs.map((job) => (
          <li key={job.id}>
            <JobCard job={job} locale={locale} />
          </li>
        ))}
        {shown.map((link, i) => {
          const host = hostOf(link.url)
          return (
            <li key={link.id ?? i}>
              <div className="flex flex-col gap-4 rounded-[18px] border border-border bg-cream p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-snug text-ink">{link.label}</h3>
                  {link.description && <p className="mt-1 text-sm text-ink-70">{link.description}</p>}
                  {host && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-50">
                      <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                      {host}
                    </p>
                  )}
                </div>
                <a
                  href={link.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue"
                >
                  {copy.jobsCta}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </li>
          )
        })}
      </ul>
    </HomeSectionShell>
  )
}
