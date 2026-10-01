import { Briefcase, Clock, MapPin } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { bundeslandLabel } from '@/fields/bundeslandField'
import { forwardArrow } from '@/i18n/routing'
import type { JobDoc } from '@/types/payload'

/**
 * Figma 6.png's list row: title with a type pill, a meta line (expiry, employment type,
 * employer · location), and a navy "details and apply" button on the end side.
 *
 * The button goes to the detail page, not straight to `applyUrl`. That is deliberate and was
 * called out during planning: sending people off-site from the listing throws away the page that
 * can actually carry `JobPosting` structured data and be indexed, and it hides the posting's own
 * terms behind someone else's site.
 */

const TYPE_LABELS: Record<string, { de: string; ar: string; en: string }> = {
  full_time: { de: 'Vollzeit', ar: 'دوام كامل', en: 'Full time' },
  part_time: { de: 'Teilzeit', ar: 'دوام جزئي', en: 'Part time' },
  apprenticeship: { de: 'Lehre', ar: 'تدريب مهني', en: 'Apprenticeship' },
  internship: { de: 'Praktikum', ar: 'تدريب', en: 'Internship' },
  volunteer: { de: 'Ehrenamt', ar: 'تطوع', en: 'Volunteering' },
}

/** Figma tints each type differently so the list can be scanned by kind, not read line by line. */
const TYPE_CLASSES: Record<string, string> = {
  full_time: 'bg-brand-blue/10 text-brand-blue',
  part_time: 'bg-brand-blue/10 text-brand-blue',
  apprenticeship: 'bg-brand-green-lt text-brand-green-dk',
  internship: 'bg-amber-100 text-amber-800',
  volunteer: 'bg-purple-100 text-purple-800',
}

const META_LABELS = {
  until: { de: 'Bis', ar: 'حتى', en: 'Until' },
  details: { de: 'Details & Bewerbung', ar: 'التفاصيل والتقديم', en: 'Details & apply' },
}

export function jobTypeLabel(type: string | null | undefined, locale: string): string | null {
  if (!type) return null
  const entry = TYPE_LABELS[type]
  if (!entry) return null
  return entry[locale === 'ar' || locale === 'en' ? locale : 'de']
}

function formatDate(value: string | null | undefined, locale: string): string | null {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return null
  }
}

export function JobCard({ job, locale }: { job: JobDoc; locale: string }) {
  const loc = (locale === 'ar' || locale === 'en' ? locale : 'de') as 'de' | 'ar' | 'en'
  const typeLabel = jobTypeLabel(job.employmentType, locale)
  const expires = formatDate(job.expiryDate, locale)
  const place = [job.organisation, job.city].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-4 rounded-[18px] border border-border bg-cream p-5 md:flex-row md:items-center md:justify-between md:p-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-lg font-bold leading-snug text-ink">{job.title}</h3>
          {typeLabel && (
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                TYPE_CLASSES[job.employmentType ?? ''] ?? 'bg-border text-ink-70'
              }`}
            >
              {typeLabel}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-50">
          {expires && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {META_LABELS.until[loc]} {expires}
            </span>
          )}
          {place && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
              {place}
            </span>
          )}
          {bundeslandLabel(job.bundesland, locale) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {bundeslandLabel(job.bundesland, locale)}
            </span>
          )}
        </div>
      </div>

      <Link
        href={{ pathname: '/jobs/[slug]', params: { slug: job.slug ?? '' } }}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue"
      >
        {META_LABELS.details[loc]}
        <span aria-hidden="true">{forwardArrow(locale)}</span>
      </Link>
    </div>
  )
}
