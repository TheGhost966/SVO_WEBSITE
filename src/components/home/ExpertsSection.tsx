import { Link } from '@/i18n/navigation'
import { forwardArrow } from '@/i18n/routing'
import type { ExpertDoc, CategoryRef } from '@/types/payload'
import { HomeSectionShell, ViewAllCard } from './shared'

export function ExpertsSection({
  locale,
  experts,
  t,
}: {
  locale: string
  experts: ExpertDoc[]
  t: (key: string) => string
}) {
  if (experts.length === 0) return null
  const shown = experts.slice(0, 3)

  return (
    <HomeSectionShell id="experts-heading" bg="bg-brand-navy">
      <div className="flex items-end justify-between gap-4 mb-8">
        <h2 id="experts-heading" className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {t('expertsHeading')}
        </h2>
        <Link href="/experts" className="text-sm font-semibold text-white/80 hover:text-white shrink-0">
          {t('allExperts')} {forwardArrow(locale)}
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((expert) => (
          <Link
            key={expert.id}
            href={{ pathname: '/experts/[slug]', params: { slug: expert.slug ?? '' } }}
            className="group bg-white/5 rounded-card border border-white/15 p-6 flex flex-col gap-2 hover:border-brand-green hover:bg-white/10 transition-all"
          >
            <h3 className="font-semibold text-white group-hover:text-brand-green transition-colors">{expert.name}</h3>
            {expert.city && <p className="text-sm text-white/60">{expert.city}</p>}
            {expert.categories && expert.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {(expert.categories as CategoryRef[])
                  .filter((c): c is CategoryRef => typeof c !== 'string')
                  .slice(0, 2)
                  .map((c) => (
                    <span key={c.id} className="text-xs bg-brand-green-lt text-brand-green-dk rounded-control px-2 py-0.5">
                      {c.name}
                    </span>
                  ))}
              </div>
            )}
          </Link>
        ))}
        <ViewAllCard href="/experts/apply" label={t('expertsApplyCta')} locale={locale} />
      </div>
    </HomeSectionShell>
  )
}
