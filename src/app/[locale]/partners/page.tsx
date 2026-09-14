import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { MediaImage } from '@/components/ui/MediaImage'
import { getPartners } from '@/lib/queries'
import type { PartnerDoc, ResolvedMedia } from '@/types/payload'

const PARTNERS_PATHS: Record<string, string> = {
  de: '/de/partner',
  ar: '/ar/partners',
  en: '/en/partners',
}

type Props = { params: Promise<{ locale: string }> }

const GROUP_ORDER = ['funder', 'partner', 'sponsor'] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'partners' })
  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      languages: {
        de: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${PARTNERS_PATHS.de}`,
        ar: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${PARTNERS_PATHS.ar}`,
        en: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${PARTNERS_PATHS.en}`,
      },
    },
  }
}

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [t, partners] = await Promise.all([
    getTranslations('partners'),
    getPartners(),
  ])

  const groups = GROUP_ORDER.map((type) => ({
    type,
    label: t(`groups.${type}`),
    items: partners.filter((p) => p.type === type),
  })).filter((g) => g.items.length > 0)

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} subtitle={t('intro')} />

      {groups.length === 0 ? (
        <p className="text-ink-50 text-sm mt-4">{t('empty')}</p>
      ) : (
        <div className="space-y-12 mt-8">
          {groups.map((group) => (
            <div key={group.type}>
              <h2 className="text-sm font-semibold text-ink-50 uppercase tracking-widest mb-6">
                {group.label}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PartnerCard({ partner }: { partner: PartnerDoc }) {
  const content = (
    <div className="bg-surface rounded-card border border-border p-6 flex items-center gap-4 h-full hover:border-brand-blue hover:shadow-sm transition-all">
      <div className="shrink-0 w-16 h-16 flex items-center justify-center">
        <MediaImage
          media={partner.logo as ResolvedMedia}
          size="thumbnail"
          className="max-h-16 w-auto object-contain"
          alt={partner.name ?? ''}
        />
      </div>
      <span className="font-semibold text-ink text-sm">{partner.name}</span>
    </div>
  )

  return partner.url ? (
    <a href={partner.url} target="_blank" rel="noopener noreferrer" className="block h-full">
      {content}
    </a>
  ) : (
    content
  )
}
