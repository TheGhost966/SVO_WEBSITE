import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/Icon'
import { getGuideTopics } from '@/lib/queries'
import { forwardArrow } from '@/i18n/routing'

const GUIDE_PATHS: Record<string, string> = {
  de: '/de/oesterreich-guide',
  ar: '/ar/guide',
  en: '/en/guide',
}

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'guide' })
  const SERVER = process.env.NEXT_PUBLIC_SERVER_URL ?? ''
  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      languages: {
        de: `${SERVER}${GUIDE_PATHS.de}`,
        ar: `${SERVER}${GUIDE_PATHS.ar}`,
        en: `${SERVER}${GUIDE_PATHS.en}`,
      },
    },
  }
}

export default async function GuidePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('guide')
  const topics = await getGuideTopics(locale)

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={t('title')} subtitle={t('intro')} />

      {topics.length === 0 ? (
        <p className="text-ink-50 py-16 text-center">{t('empty')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={{ pathname: '/guide/[topic]', params: { topic: topic.slug ?? topic.id ?? '' } }}
              className="group bg-surface rounded-card border border-border p-8 flex gap-6 hover:border-brand-blue hover:shadow-md transition-all"
            >
              <div
                className="shrink-0 w-14 h-14 rounded-card flex items-center justify-center text-2xl"
                style={{ backgroundColor: 'var(--color-brand-green-lt)', color: 'var(--color-brand-green-dk)' }}
                aria-hidden="true"
              >
                <Icon name={topic.icon} fallback="📘" className="w-7 h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-ink text-lg group-hover:text-brand-blue transition-colors leading-tight mb-2">
                  {topic.title}
                </h2>
                {topic.description && (
                  <p className="text-sm text-ink-70 line-clamp-3">{topic.description}</p>
                )}
                <span className="inline-block mt-4 text-sm font-semibold text-brand-blue">
                  {t('viewArticles')} {forwardArrow(locale)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
