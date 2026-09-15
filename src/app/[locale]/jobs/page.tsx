import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getSiteSettings } from '@/lib/queries'

const JOBS_PATHS: Record<string, string> = {
  de: '/de/stellenangebote',
  ar: '/ar/jobs',
  en: '/en/jobs',
}

type Props = { params: Promise<{ locale: string }> }

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

// This is deliberately a curated-links page, not a job board — see
// DECISIONS.md "Jobs slice" for why (BRIEF-AMENDMENT-01 §4: no confirmed
// weekly maintainer for a full Jobs collection yet).
export default async function JobsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('jobs')
  const settings = await getSiteSettings(locale)
  const links = settings?.jobResourceLinks ?? []

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[800px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} subtitle={t('intro')} />

      {links.length === 0 ? (
        <p className="text-ink-50 py-16 text-center">{t('empty')}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {links.map((link, i) => (
            <li key={link.id ?? i} className="bg-surface rounded-card border border-border p-5">
              <a
                href={link.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="font-semibold text-brand-blue hover:text-brand-navy transition-colors"
              >
                {link.label} ↗
              </a>
              {link.description && <p className="mt-1 text-sm text-ink-70">{link.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
