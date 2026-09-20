import { Briefcase, ExternalLink } from 'lucide-react'
import { HomeSectionShell, SectionHead } from './shared'
import { homeCopy } from './copy'

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
 * BRIEF-AMENDMENT-02 §1: this teaser reflects the curated-external-links reality
 * (`SiteSettings.jobResourceLinks`) — no `Jobs` collection exists. Figma 6.png's row layout is used
 * (cream rounded rows, title + meta on the start side, navy button on the end side), but the
 * Figma's type tag / employer / expiry date / hours are NOT invented: the meta line shows the
 * link's real host instead.
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
  const copy = homeCopy(locale)
  const shown = links.slice(0, 4)

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
