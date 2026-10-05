import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { JobCard } from '@/components/ui/JobCard'
import { getSiteSettings, getJobs } from '@/lib/queries'

const JOBS_PATHS: Record<string, string> = {
  de: '/de/stellenangebote',
  ar: '/ar/jobs',
  en: '/en/jobs',
}

type Props = { params: Promise<{ locale: string }> }

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


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'jobs' })
  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      languages: {
        de: `${SERVER}${JOBS_PATHS.de}`,
        ar: `${SERVER}${JOBS_PATHS.ar}`,
        en: `${SERVER}${JOBS_PATHS.en}`,
      },
    },
  }
}

/**
 * Real postings on top, curated portal links underneath.
 *
 * Both halves earn their place: the `jobs` collection only ever holds what the board has actually
 * vetted and dated, and `getJobs` drops anything past its `expiryDate`, so the list is empty
 * whenever nobody is maintaining it. The portal links below never expire and never need
 * maintenance, so the page still answers "where do I look for work?" on its worst day — which is
 * the concern that got the full job board deferred in the first place.
 */
export default async function JobsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('jobs')

  const [settings, jobs] = await Promise.all([getSiteSettings(locale), getJobs(locale, 50)])
  const links = settings?.jobResourceLinks ?? []

  return (
    <div
      className="mx-auto max-w-[900px] py-12 md:py-[84px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} subtitle={t('intro')} />

      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-border bg-cream px-5 py-10 text-center text-ink-50">
          {t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} locale={locale} />
            </li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="text-xl font-bold text-ink">{t('portals')}</h2>
          <p className="mt-1 text-sm text-ink-70">{t('portalsIntro')}</p>
          <ul className="mt-5 flex flex-col gap-3">
            {links.map((link, i) => (
              <li key={link.id ?? i} className="rounded-card border border-border bg-surface p-5">
                <a
                  href={link.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="font-semibold text-brand-blue transition-colors hover:text-brand-navy"
                >
                  {link.label} ↗
                </a>
                {link.description && <p className="mt-1 text-sm text-ink-70">{link.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
