import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Briefcase, Clock, MapPin } from 'lucide-react'
import { LexicalContent } from '@/components/ui/LexicalContent'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SmartLink } from '@/components/ui/SmartLink'
import { jobTypeLabel } from '@/components/ui/JobCard'
import { bundeslandLabel } from '@/fields/bundeslandField'
import { getJobBySlug, getJobSlugs } from '@/lib/queries'
import { buildMetadata } from '@/lib/seo'
import { jobPostingSchema, breadcrumbSchema } from '@/lib/jsonld'
import { backArrow } from '@/i18n/routing'

const JOBS_BASE: Record<string, string> = {
  de: '/de/stellenangebote',
  ar: '/ar/jobs',
  en: '/en/jobs',
}

const JOBS_LABEL: Record<string, string> = {
  de: 'Stellenangebote',
  ar: 'عروض العمل',
  en: 'Jobs',
}

const HOME_LABEL: Record<string, string> = {
  de: 'Startseite',
  ar: 'الرئيسية',
  en: 'Home',
}

type Props = { params: Promise<{ locale: string; slug: string }> }

/**
 * Job pages are time-sensitive in a way the rest of the site is not: a posting has to stop being
 * public when its `expiryDate` passes, and nothing triggers a rebuild at that moment. Without
 * this, the prerendered HTML keeps serving an expired vacancy indefinitely even though
 * `getJobs`/`getJobBySlug` would now filter it out — verified: expiring a posting in the database
 * left it listed and its detail page returning 200 until the page itself revalidated.
 *
 * 300s matches the queries' own `revalidate`, so the page and its data expire together.
 */
export const revalidate = 300


/**
 * Only unexpired postings get prerendered — `getJobSlugs` applies the same `expiryDate` filter as
 * the page itself, so a closed vacancy stops being a static route as well as stopping being
 * rendered.
 */
export async function generateStaticParams() {
  const slugs = await getJobSlugs()
  return ['de', 'ar', 'en'].flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const job = await getJobBySlug(slug, locale)
  if (!job) return {}
  return buildMetadata({ doc: job, locale, fallbackTitle: job.title ?? undefined })
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('jobs')

  // Returns null for an expired posting as well as a missing one, so a link shared after the
  // deadline 404s instead of quietly serving a vacancy nobody can apply for any more.
  const job = await getJobBySlug(slug, locale)
  if (!job) notFound()

  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  const base = JOBS_BASE[locale] ?? JOBS_BASE.de
  const url = `${SERVER}${base}/${slug}`
  const typeLabel = jobTypeLabel(job.employmentType, locale)
  const region = bundeslandLabel(job.bundesland, locale)

  const dateFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale === 'en' ? 'en-GB' : 'de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const expires = job.expiryDate ? dateFmt.format(new Date(job.expiryDate)) : null

  const facts: Array<{ label: string; value: string; icon: React.ReactNode }> = []
  if (job.organisation) facts.push({ label: t('employer'), value: job.organisation, icon: <Briefcase className="h-4 w-4" /> })
  if (job.city || region)
    facts.push({ label: t('location'), value: [job.city, region].filter(Boolean).join(' · '), icon: <MapPin className="h-4 w-4" /> })
  if (typeLabel) facts.push({ label: t('type'), value: typeLabel, icon: <Briefcase className="h-4 w-4" /> })
  if (expires) facts.push({ label: t('expires'), value: expires, icon: <Clock className="h-4 w-4" /> })

  return (
    <div
      className="mx-auto max-w-[800px] py-12 md:py-[84px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            jobPostingSchema({
              title: job.title ?? '',
              organisation: job.organisation,
              city: job.city,
              region,
              datePosted: job.publishedAt,
              validThrough: job.expiryDate,
              employmentType: job.employmentType,
              url,
            }),
            breadcrumbSchema([
              { name: HOME_LABEL[locale] ?? HOME_LABEL.de, url: `${SERVER}/${locale}` },
              { name: JOBS_LABEL[locale] ?? JOBS_LABEL.de, url: `${SERVER}${base}` },
              { name: job.title ?? '', url },
            ]),
          ]),
        }}
      />

      <Breadcrumb
        items={[
          { label: HOME_LABEL[locale] ?? HOME_LABEL.de, href: '/' },
          { label: JOBS_LABEL[locale] ?? JOBS_LABEL.de, href: '/jobs' },
          { label: job.title ?? '' },
        ]}
      />

      <h1 className="mt-6 text-3xl font-bold leading-tight text-ink md:text-4xl">{job.title}</h1>

      {facts.length > 0 && (
        <dl className="mt-6 grid gap-4 rounded-2xl border border-border bg-cream p-5 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-start gap-3">
              <span className="mt-0.5 text-brand-blue" aria-hidden="true">
                {fact.icon}
              </span>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-50">{fact.label}</dt>
                <dd className="text-sm font-medium text-ink">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      )}

      {job.description ? <LexicalContent content={job.description} className="mt-8" /> : null}

      <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8">
        <SmartLink
          href={job.applyUrl ?? '#'}
          // `applyUrl` is an employer's own site, so it opens in a new tab and carries nofollow —
          // the association is listing the vacancy, not vouching for the destination.
          target={job.applyUrl?.startsWith('mailto:') ? undefined : '_blank'}
          rel="noopener noreferrer nofollow"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-brand-green px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-brand-green-dk"
        >
          {t('apply')}
          <span aria-hidden="true">↗</span>
        </SmartLink>
        <p className="text-xs text-ink-50">{t('externalNote')}</p>
      </div>

      <SmartLink href={base} className="mt-10 inline-block text-sm font-semibold text-brand-blue">
        {backArrow(locale)} {t('backToJobs')}
      </SmartLink>
    </div>
  )
}
