import type { Metadata } from 'next'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { searchSite } from '@/lib/queries'
import { forwardArrow } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'search' })
  return { title: t('title'), robots: { index: false } }
}

/**
 * Backs the hero search bar (`HeroSection`'s `<form action="/search">`). Real results from
 * `searchSite` (a `like` match per collection) — never invented content. `noIndex` via metadata
 * above: query-string result pages shouldn't be crawled/indexed.
 */
export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('search')
  const query = (q ?? '').trim()

  const results = query ? await searchSite(locale, query) : { news: [], events: [], roadmaps: [], guideArticles: [], experts: [] }
  const totalResults =
    results.news.length + results.events.length + results.roadmaps.length + results.guideArticles.length + results.experts.length

  return (
    <div
      className="py-12 md:py-[84px] mx-auto max-w-[1200px]"
      style={{ paddingInlineStart: 'clamp(24px, 5vw, 120px)', paddingInlineEnd: 'clamp(24px, 5vw, 120px)' }}
    >
      <SectionHeader title={query ? t('resultsFor', { query }) : t('title')} />

      {!query && <p className="text-ink-50">{t('noQuery')}</p>}
      {query && totalResults === 0 && <p className="text-ink-50">{t('noResults', { query })}</p>}

      {totalResults > 0 && (
        <div className="flex flex-col gap-10">
          {results.news.length > 0 && (
            <ResultGroup heading={t('sectionNews')}>
              {results.news.map((doc) => (
                <ResultRow key={doc.id} title={doc.title} href={{ pathname: '/news/[slug]', params: { slug: doc.slug ?? '' } }} locale={locale} />
              ))}
            </ResultGroup>
          )}
          {results.events.length > 0 && (
            <ResultGroup heading={t('sectionEvents')}>
              {results.events.map((doc) => (
                <ResultRow key={doc.id} title={doc.title} href={{ pathname: '/events/[slug]', params: { slug: doc.slug ?? '' } }} locale={locale} />
              ))}
            </ResultGroup>
          )}
          {results.roadmaps.length > 0 && (
            <ResultGroup heading={t('sectionRoadmaps')}>
              {results.roadmaps.map((doc) => (
                <ResultRow key={doc.id} title={doc.title} href={{ pathname: '/roadmaps/[roadmap]', params: { roadmap: doc.slug ?? '' } }} locale={locale} />
              ))}
            </ResultGroup>
          )}
          {results.guideArticles.length > 0 && (
            <ResultGroup heading={t('sectionGuide')}>
              {results.guideArticles.map((doc) => {
                const topic = doc.topic
                const topicSlug = topic && typeof topic !== 'string' ? topic.slug ?? '' : ''
                return (
                  <ResultRow
                    key={doc.id}
                    title={doc.title}
                    href={{ pathname: '/guide/[topic]/[article]', params: { topic: topicSlug, article: doc.slug ?? '' } }}
                    locale={locale}
                  />
                )
              })}
            </ResultGroup>
          )}
          {results.experts.length > 0 && (
            <ResultGroup heading={t('sectionExperts')}>
              {results.experts.map((doc) => (
                <ResultRow key={doc.id} title={doc.name} href={{ pathname: '/experts/[slug]', params: { slug: doc.slug ?? '' } }} locale={locale} />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-brand-green-dk">{heading}</h2>
      <ul className="flex flex-col gap-3">{children}</ul>
    </section>
  )
}

function ResultRow({
  title,
  href,
  locale,
}: {
  title?: string | null
  href: Parameters<typeof Link>[0]['href']
  locale: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand-blue hover:text-brand-blue"
      >
        <span className="font-semibold text-ink">{title ?? '—'}</span>
        <span aria-hidden="true" className="text-ink-50">{forwardArrow(locale)}</span>
      </Link>
    </li>
  )
}
