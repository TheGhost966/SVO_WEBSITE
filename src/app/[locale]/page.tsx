import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'SVÖ — Syrischer Verband in Österreich',
    description: locale === 'ar'
      ? 'الاتحاد السوري في النمسا — نبني · نربط · ننفذ'
      : locale === 'en'
        ? 'The Syrian Association in Austria — Building. Connecting. Delivering.'
        : 'Der Syrische Verband in Österreich — Bauen. Verbinden. Umsetzen.',
  }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')

  return (
    <div>
      {/* [DE] Startseite — Inhalte werden vom SVÖ-Team bereitgestellt. */}
      {/* Placeholder — replace with real page blocks once CMS content is ready */}
      <section className="flex min-h-[60vh] items-center justify-center bg-brand-navy text-white text-center px-6">
        <div>
          <h1 className="text-4xl font-bold mb-4">SVÖ</h1>
          <p className="text-lg text-white/80">Bauen. Verbinden. Umsetzen.</p>
          <p className="mt-2 text-sm text-white/50">
            [DE] Startseite — Inhalte folgen nach Redaktionsfreigabe.
          </p>
        </div>
      </section>
    </div>
  )
}
