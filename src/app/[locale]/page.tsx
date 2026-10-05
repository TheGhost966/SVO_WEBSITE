import type { Metadata } from 'next'
import { Fragment } from 'react'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import {
  getSiteSettings,
  getLatestNews,
  getUpcomingEvents,
  getRoadmaps,
  getGuideTopics,
  getExperts,
  getExpertCategories,
  getHomeStatCounts,
  getJobs,
} from '@/lib/queries'
import { DEFAULT_HOME_SECTION_ORDER, type HomeSection } from '@/lib/homeSections'
import { HeroSection } from '@/components/home/HeroSection'
import { StatsSection } from '@/components/home/StatsSection'
import { NewsSection } from '@/components/home/NewsSection'
import { EventsSection } from '@/components/home/EventsSection'
import { HelpCardsSection } from '@/components/home/HelpCardsSection'
import { RoadmapsSection } from '@/components/home/RoadmapsSection'
import { GuideSection } from '@/components/home/GuideSection'
import { ExpertsSection } from '@/components/home/ExpertsSection'
import { JobsSection } from '@/components/home/JobsSection'
import { CtaBandSection } from '@/components/home/CtaBandSection'
import { quizHasNoDeadEnds } from '@/lib/quiz'

type Props = { params: Promise<{ locale: string }> }

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const titles: Record<string, string> = {
    de: 'SVÖ — Syrischer Verband in Österreich',
    ar: 'الاتحاد السوري في النمسا',
    en: 'SVÖ — Syrian Association in Austria',
  }
  const descs: Record<string, string> = {
    de: 'Bauen. Verbinden. Umsetzen. — Der SVÖ unterstützt die syrische Gemeinschaft in Österreich.',
    ar: 'نبني · نربط · ننفذ — الاتحاد السوري في النمسا يدعم المجتمع السوري.',
    en: 'Building. Connecting. Delivering. — SVÖ supports the Syrian community in Austria.',
  }
  return { title: titles[locale], description: descs[locale] }
}

// ─── Page ────────────────────────────────────────────────────────────────────

/**
 * Homepage is fully bespoke React sections (no `pages`
 * page-builder/BlockRenderer path — a `pages` record with slug `home` is permanently inert),
 * rendered in `SiteSettings.homeGroup.sectionOrder`'s board-editable order,
 * falling back to the default order when that array is empty.
 *
 * Query discipline: every section's data is fetched in one `Promise.all`,
 * teaser queries take an explicit `limit` rather than fetching a full collection to slice
 * client-side, and the stats band reads count-only queries (`payload.count`), never a full find.
 */
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')

  const [siteSettings, newsResult, eventsResult, roadmaps, guideTopics, experts, expertCategories, statCounts, jobs] = await Promise.all([
    getSiteSettings(locale),
    getLatestNews(locale, 3),
    getUpcomingEvents(locale, 3),
    getRoadmaps(locale, 4),
    getGuideTopics(locale, 12),
    getExperts(locale, undefined, 4),
    getExpertCategories(locale),
    getHomeStatCounts(),
    getJobs(locale, 4),
  ])

  // The quiz band is only offered when no combination of answers ends without a roadmap.
  const quizReady = quizHasNoDeadEnds(await getRoadmaps(locale, 100))

  const configuredOrder = siteSettings?.homeGroup?.sectionOrder
  const sectionOrder = (configuredOrder && configuredOrder.length > 0 ? configuredOrder : DEFAULT_HOME_SECTION_ORDER).filter(
    (row) => row.enabled,
  )

  const jobLinks = siteSettings?.jobResourceLinks ?? []

  const sections: Record<HomeSection, React.ReactNode> = {
    hero: <HeroSection locale={locale} siteSettings={siteSettings} roadmap={roadmaps.find((r) => (r.steps?.length ?? 0) > 0) ?? null} />,
    stats: <StatsSection locale={locale} siteSettings={siteSettings} statCounts={statCounts} t={t} />,
    news: <NewsSection locale={locale} news={newsResult.docs} t={t} />,
    events: <EventsSection locale={locale} events={eventsResult.docs} t={t} />,
    helpCards: <HelpCardsSection locale={locale} siteSettings={siteSettings} t={t} />,
    roadmaps: <RoadmapsSection locale={locale} roadmaps={roadmaps} quizReady={quizReady} t={t} />,
    guide: <GuideSection locale={locale} topics={guideTopics} t={t} />,
    experts: <ExpertsSection locale={locale} experts={experts} categories={expertCategories} t={t} />,
    jobs: <JobsSection locale={locale} jobs={jobs} links={jobLinks} t={t} />,
    ctaBand: <CtaBandSection locale={locale} siteSettings={siteSettings} />,
    // Removed. The value stays valid so a stored section order still loads.
    appBand: null,
  }

  return (
    <>
      {sectionOrder.map((row) => (
        <Fragment key={row.section}>{sections[row.section]}</Fragment>
      ))}
    </>
  )
}
