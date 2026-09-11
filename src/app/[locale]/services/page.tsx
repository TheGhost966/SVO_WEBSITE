import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { getServicePillars } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('services')
  const { docs: pillars } = await getServicePillars(locale)

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} subtitle={t('intro')} />
      <div className="grid gap-6 sm:grid-cols-2">
        {pillars.map((pillar) => (
          <Link
            key={pillar.id}
            href={{ pathname: '/services/[pillar]', params: { pillar: pillar.slug ?? pillar.id } }}
            className="group bg-surface rounded-card border border-border p-8 hover:border-brand-blue hover:shadow-md transition-all"
          >
            <h2 className="text-xl font-bold text-ink group-hover:text-brand-blue transition-colors mb-3">
              {pillar.title}
            </h2>
            {pillar.description && <p className="text-ink-70 text-sm">{pillar.description}</p>}
            <span className="mt-4 inline-block text-sm font-semibold text-brand-blue">{t('learnMore')} →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
