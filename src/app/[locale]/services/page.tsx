import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/Icon'
import { getServicePillars } from '@/lib/queries'

const PILLAR_ICON_FALLBACK: Record<string, string> = {
  'graduation-cap': '🎓',
  trophy: '🏆',
  heart: '❤️',
  scale: '⚖️',
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services' })
  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      languages: {
        de: `${SERVER}/de/leistungen`,
        ar: `${SERVER}/ar/services`,
        en: `${SERVER}/en/services`,
      },
    },
  }
}

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

      {pillars.length === 0 ? (
        <p className="text-ink-50 py-16 text-center">
          {locale === 'ar' ? 'لا توجد خدمات متاحة حاليًا.' : locale === 'en' ? 'No services available yet.' : 'Noch keine Leistungen verfügbar.'}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Link
              key={pillar.id}
              href={{ pathname: '/services/[pillar]', params: { pillar: pillar.slug ?? pillar.id ?? '' } }}
              className="group bg-surface rounded-card border border-border p-8 flex gap-6 hover:border-brand-blue hover:shadow-md transition-all"
            >
              {/* Icon */}
              <div
                className="shrink-0 w-14 h-14 rounded-card flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: pillar.colourToken
                    ? `color-mix(in srgb, var(${pillar.colourToken}) 12%, white)`
                    : 'var(--color-brand-green-lt)',
                  color: pillar.colourToken
                    ? `var(${pillar.colourToken})`
                    : 'var(--color-brand-green-dk)',
                }}
                aria-hidden="true"
              >
                <Icon
                  name={pillar.icon}
                  fallback={PILLAR_ICON_FALLBACK[pillar.icon ?? ''] ?? '📋'}
                  className="w-7 h-7"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-ink text-lg group-hover:text-brand-blue transition-colors leading-tight mb-2">
                  {pillar.title}
                </h2>
                {pillar.description && (
                  <p className="text-sm text-ink-70 line-clamp-3">{pillar.description}</p>
                )}
                <span className="inline-block mt-4 text-sm font-semibold text-brand-blue">
                  {t('learnMore')} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
