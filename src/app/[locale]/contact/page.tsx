import { setRequestLocale, getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/SectionHeader'

type Props = { params: Promise<{ locale: string }> }

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('contact')

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px] max-w-2xl"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} />
      <p className="text-ink-50 text-sm">[{locale.toUpperCase()}] Kontaktformular folgt im Contact-Slice.</p>
    </div>
  )
}
