import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CategoryFilter } from '@/components/ui/CategoryFilter'
import { getExperts, getExpertCategories } from '@/lib/queries'
import { forwardArrow } from '@/i18n/routing'

const EXPERTS_PATHS: Record<string, string> = {
  de: '/de/experten',
  ar: '/ar/experts',
  en: '/en/experts',
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ cat?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'experts' })
  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      languages: {
        de: `${SERVER}${EXPERTS_PATHS.de}`,
        ar: `${SERVER}${EXPERTS_PATHS.ar}`,
        en: `${SERVER}${EXPERTS_PATHS.en}`,
      },
    },
  }
}

export default async function ExpertsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { cat } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('experts')
  const basePath = EXPERTS_PATHS[locale] ?? EXPERTS_PATHS.de

  const [experts, categories] = await Promise.all([
    getExperts(locale, cat),
    getExpertCategories(),
  ])

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <SectionHeader title={t('title')} subtitle={t('intro')} />
        <Link
          href="/experts/apply"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-control bg-brand-green text-white font-semibold text-sm hover:bg-brand-green-dk transition-colors"
        >
          {t('applyCta')}
        </Link>
      </div>

      {categories.length > 0 && (
        <CategoryFilter categories={categories} currentSlug={cat} allLabel={t('filterAll')} basePath={basePath} />
      )}

      {experts.length === 0 ? (
        <p className="text-ink-50 py-16 text-center">{t('empty')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <Link
              key={expert.id}
              href={{ pathname: '/experts/[slug]', params: { slug: expert.slug ?? expert.id } }}
              className="group bg-surface rounded-card border border-border p-6 hover:border-brand-blue hover:shadow-md transition-all"
            >
              <h2 className="font-bold text-ink text-lg group-hover:text-brand-blue transition-colors leading-tight mb-1">
                {expert.name}
              </h2>
              {expert.city && <p className="text-sm text-ink-50 mb-2">{expert.city}</p>}
              {expert.categories && expert.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {expert.categories
                    .filter((c): c is { id: string; name?: string | null } => typeof c === 'object')
                    .map((c) => (
                      <span key={c.id} className="text-xs bg-brand-green-lt text-brand-green-dk rounded-control px-2 py-0.5">
                        {c.name}
                      </span>
                    ))}
                </div>
              )}
              {expert.bio && <p className="text-sm text-ink-70 line-clamp-3">{expert.bio}</p>}
              <span className="inline-block mt-3 text-sm font-semibold text-brand-blue">
                {t('viewProfile')} {forwardArrow(locale)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
