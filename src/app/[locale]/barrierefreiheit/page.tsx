import { setRequestLocale, getTranslations } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function BarrierefreiheitPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal')

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px] max-w-3xl"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <h1 className="text-3xl font-bold text-ink mb-8">{t('barrierefreiheit')}</h1>
      {/* Barrierefreiheitserklärung (WCAG 2.1 AA) — to be provided by SVÖ board. */}
      <div className="p-6 rounded-card border-2 border-dashed border-brand-blue/30 bg-brand-blue/5">
        <p className="text-brand-blue font-semibold text-sm mb-2">⚠ Inhalt ausstehend</p>
        <p className="text-ink-70 text-sm">{t('placeholder')}</p>
      </div>
    </div>
  )
}
