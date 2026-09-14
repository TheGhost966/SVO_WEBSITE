import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { ExpertApplicationForm } from '@/components/ui/ExpertApplicationForm'
import { getExpertCategories } from '@/lib/queries'

const HOME_LABEL: Record<string, string> = { de: 'Startseite', ar: 'الرئيسية', en: 'Home' }
const EXPERTS_LABEL: Record<string, string> = { de: 'Expert:innen', ar: 'الخبراء', en: 'Experts' }

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'experts' })
  return { title: t('applyTitle') }
}

export default async function ExpertApplyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('experts')
  const categories = await getExpertCategories()

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[700px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <Breadcrumb
        items={[
          { label: HOME_LABEL[locale] ?? 'Home', href: '/' },
          { label: EXPERTS_LABEL[locale] ?? 'Experts', href: '/experts' },
          { label: t('applyTitle') },
        ]}
      />
      <SectionHeader title={t('applyTitle')} subtitle={t('applyIntro')} />
      <ExpertApplicationForm locale={locale} categories={categories} />
    </div>
  )
}
