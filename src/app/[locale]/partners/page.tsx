import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'

type Props = { params: Promise<{ locale: string }> }

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('partners')

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} subtitle={t('intro')} />
      <p className="text-ink-50 text-sm mt-4">[{locale.toUpperCase()}] Partner-Logos folgen nach Dateneingabe.</p>
    </div>
  )
}
