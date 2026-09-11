import { setRequestLocale } from 'next-intl/server'

type Props = { params: Promise<{ locale: string }> }

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="py-20 px-6 text-center">
      <h1 className="text-3xl font-bold text-ink mb-4">
        {locale === 'ar' ? 'من نحن' : locale === 'en' ? 'About Us' : 'Über uns'}
      </h1>
      <p className="text-ink-50 text-sm">[{locale.toUpperCase()}] Inhalt folgt nach Redaktionsfreigabe.</p>
    </div>
  )
}
