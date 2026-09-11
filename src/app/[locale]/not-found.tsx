import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('common')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6 gap-6">
      <p className="text-8xl font-bold text-brand-blue/20 select-none">404</p>
      <h1 className="text-2xl font-semibold text-ink">{t('notFound')}</h1>
      <p className="text-ink-70 max-w-md">{t('notFoundDesc')}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-control bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-brand-green-dk transition-colors"
      >
        {t('backToHome')}
      </Link>
    </div>
  )
}
