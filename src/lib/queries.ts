import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'
import { getPayloadClient, tags } from './payload'
import type { NewsDoc, EventDoc, ServicePillarDoc, ServiceDoc, PageDoc, SiteSettingsDoc, PartnerDoc, GuideTopicDoc, GuideArticleDoc, RoadmapDoc, ExpertDoc } from '@/types/payload'

type PaginatedResult<T> = { docs: T[]; totalDocs: number; hasNextPage: boolean }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function empty<T>(): PaginatedResult<T> {
  return { docs: [], totalDocs: 0, hasNextPage: false }
}

/**
 * True if `locale`'s `title` field on this doc is empty and Payload silently
 * served the default-locale (`de`) value instead (`localization.fallback: true`).
 * Re-fetches with `fallbackLocale: false` to see the raw, un-fallen-back value.
 */
async function isLocaleFallback(
  collection: 'news' | 'events' | 'services' | 'guide-articles' | 'roadmaps',
  id: string,
  locale: string,
): Promise<boolean> {
  if (locale === 'de') return false
  try {
    const payload = await getPayloadClient()
    const raw = await payload.findByID({
      collection,
      id,
      locale: locale as 'ar' | 'en',
      fallbackLocale: false,
      depth: 0,
    })
    return !raw?.title
  } catch {
    return false
  }
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export const getPageBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<PageDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'pages',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 3,
        limit: 1,
      })
      return (result.docs[0] as unknown as PageDoc) ?? null
    } catch {
      return null
    }
  },
  ['page-by-slug'],
  { revalidate: 60, tags: [tags.pages()] },
)

// ─── News ─────────────────────────────────────────────────────────────────────

export const getLatestNews = unstable_cache(
  async (locale: string, limit = 3): Promise<PaginatedResult<NewsDoc>> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'news',
        where: { reviewStatus: { equals: 'published' } },
        sort: '-publishedAt',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit,
      })
      return result as unknown as PaginatedResult<NewsDoc>
    } catch {
      return empty<NewsDoc>()
    }
  },
  ['latest-news'],
  { revalidate: 60, tags: [tags.news()] },
)

export const getNewsPage = unstable_cache(
  async (locale: string, page = 1, categorySlug?: string): Promise<PaginatedResult<NewsDoc>> => {
    try {
      const payload = await getPayloadClient()
      const where: Where = { reviewStatus: { equals: 'published' } }
      if (categorySlug) {
        where['category.slug'] = { equals: categorySlug }
      }
      const result = await payload.find({
        collection: 'news',
        where,
        sort: '-publishedAt',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit: 9,
        page,
      })
      return result as unknown as PaginatedResult<NewsDoc>
    } catch {
      return empty<NewsDoc>()
    }
  },
  ['news-page'],
  { revalidate: 60, tags: [tags.news()] },
)

export const getNewsBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<NewsDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'news',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 3,
        limit: 1,
      })
      const doc = result.docs[0] as unknown as NewsDoc | undefined
      if (!doc) return null
      doc._isFallback = await isLocaleFallback('news', doc.id, locale)
      return doc
    } catch {
      return null
    }
  },
  ['news-by-slug'],
  { revalidate: 60, tags: [tags.newsItem('', '')] },
)

// ─── Events ──────────────────────────────────────────────────────────────────

export const getUpcomingEvents = unstable_cache(
  async (locale: string, limit = 3): Promise<PaginatedResult<EventDoc>> => {
    try {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()
      const result = await payload.find({
        collection: 'events',
        where: {
          and: [
            { reviewStatus: { equals: 'published' } },
            { startDate: { greater_than: now } },
          ],
        },
        sort: 'startDate',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit,
      })
      return result as unknown as PaginatedResult<EventDoc>
    } catch {
      return empty<EventDoc>()
    }
  },
  ['upcoming-events'],
  { revalidate: 60, tags: [tags.events()] },
)

export const getNewsCategories = unstable_cache(
  async (): Promise<Array<{ id: string; name?: string | null; slug?: string | null }>> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        where: { type: { equals: 'news' } },
        sort: 'name',
        depth: 0,
        limit: 50,
      })
      return result.docs.map((d: { id: string | number; name?: string | null; slug?: string | null }) => ({ id: String(d.id), name: d.name, slug: d.slug }))
    } catch {
      return []
    }
  },
  ['news-categories'],
  { revalidate: 3600, tags: ['categories'] },
)

/**
 * Fetch a news document with ALL locales so the caller can extract
 * per-locale slugs for hreflang links.
 * Returns `null` on any error.
 */
export async function getNewsAllLocaleSlugs(
  id: string,
): Promise<Record<string, string>> {
  try {
    const payload = await getPayloadClient()
    const doc = await payload.findByID({
      collection: 'news',
      id,
      locale: 'all',
      depth: 0,
    })
    // With locale:'all', localised fields come back as { de: '...', ar: '...', en: '...' }
    const slugField = (doc as { slug?: unknown })?.slug
    if (!slugField || typeof slugField !== 'object') return {}
    return Object.fromEntries(
      Object.entries(slugField as Record<string, unknown>).filter(
        ([ , v]) => typeof v === 'string' && Boolean(v),
      ),
    ) as Record<string, string>
  } catch {
    return {}
  }
}

export const getEventCategories = unstable_cache(
  async (): Promise<Array<{ id: string; name?: string | null; slug?: string | null }>> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        where: { type: { equals: 'event' } },
        sort: 'name',
        depth: 0,
        limit: 50,
      })
      return result.docs.map((d: { id: string | number; name?: string | null; slug?: string | null }) => ({ id: String(d.id), name: d.name, slug: d.slug }))
    } catch {
      return []
    }
  },
  ['event-categories'],
  { revalidate: 3600, tags: ['categories'] },
)

export const getUpcomingEventsPaged = unstable_cache(
  async (locale: string, page = 1, categorySlug?: string): Promise<PaginatedResult<EventDoc>> => {
    try {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()
      const where: Where = {
        and: [
          { reviewStatus: { equals: 'published' } },
          { startDate: { greater_than: now } },
        ],
      }
      if (categorySlug) where.and?.push({ 'category.slug': { equals: categorySlug } })
      const result = await payload.find({
        collection: 'events',
        where,
        sort: 'startDate',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit: 9,
        page,
      })
      return result as unknown as PaginatedResult<EventDoc>
    } catch {
      return empty<EventDoc>()
    }
  },
  ['upcoming-events-paged'],
  { revalidate: 60, tags: [tags.events()] },
)

export const getPastEvents = unstable_cache(
  async (locale: string, page = 1, categorySlug?: string): Promise<PaginatedResult<EventDoc>> => {
    try {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()
      const where: Where = {
        and: [
          { reviewStatus: { equals: 'published' } },
          { startDate: { less_than: now } },
        ],
      }
      if (categorySlug) where.and?.push({ 'category.slug': { equals: categorySlug } })
      const result = await payload.find({
        collection: 'events',
        where,
        sort: '-startDate', // most recent past first
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit: 9,
        page,
      })
      return result as unknown as PaginatedResult<EventDoc>
    } catch {
      return empty<EventDoc>()
    }
  },
  ['past-events'],
  { revalidate: 60, tags: [tags.events()] },
)

export const getEventBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<EventDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'events',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 3,
        limit: 1,
      })
      const doc = result.docs[0] as unknown as EventDoc | undefined
      if (!doc) return null
      doc._isFallback = await isLocaleFallback('events', doc.id, locale)
      return doc
    } catch {
      return null
    }
  },
  ['event-by-slug'],
  { revalidate: 60, tags: [tags.events()] },
)

export async function getEventAllLocaleSlugs(id: string): Promise<Record<string, string>> {
  try {
    const payload = await getPayloadClient()
    const doc = await payload.findByID({
      collection: 'events',
      id,
      locale: 'all',
      depth: 0,
    })
    const slugField = (doc as { slug?: unknown })?.slug
    if (!slugField || typeof slugField !== 'object') return {}
    return Object.fromEntries(
      Object.entries(slugField as Record<string, unknown>).filter(
        ([, v]) => typeof v === 'string' && Boolean(v),
      ),
    ) as Record<string, string>
  } catch {
    return {}
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────

// ─── Services (detailed queries) ──────────────────────────────────────────────

export const getPillarBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<ServicePillarDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'service-pillars',
        where: { slug: { equals: slug } },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit: 1,
      })
      return (result.docs[0] as unknown as ServicePillarDoc) ?? null
    } catch {
      return null
    }
  },
  ['pillar-by-slug'],
  { revalidate: 3600, tags: [tags.services()] },
)

export const getServicesByPillar = unstable_cache(
  async (pillarSlug: string, locale: string): Promise<ServiceDoc[]> => {
    try {
      const payload = await getPayloadClient()
      // Step 1: resolve pillar ID from slug
      const pillarResult = await payload.find({
        collection: 'service-pillars',
        where: { slug: { equals: pillarSlug } },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: 1,
      })
      const pillar = pillarResult.docs[0]
      if (!pillar) return []

      // Step 2: find all published services for that pillar
      const result = await payload.find({
        collection: 'services',
        where: {
          and: [
            { pillar: { equals: pillar.id } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        sort: 'title',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit: 50,
      })
      return result.docs as unknown as ServiceDoc[]
    } catch {
      return []
    }
  },
  ['services-by-pillar'],
  { revalidate: 60, tags: [tags.services()] },
)

export const getServiceBySlug = unstable_cache(
  async (pillarSlug: string, serviceSlug: string, locale: string): Promise<ServiceDoc | null> => {
    try {
      const payload = await getPayloadClient()
      // Step 1: resolve pillar ID
      const pillarResult = await payload.find({
        collection: 'service-pillars',
        where: { slug: { equals: pillarSlug } },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: 1,
      })
      const pillar = pillarResult.docs[0]
      if (!pillar) return null

      // Step 2: find service within that pillar
      const result = await payload.find({
        collection: 'services',
        where: {
          and: [
            { slug: { equals: serviceSlug } },
            { pillar: { equals: pillar.id } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 3,
        limit: 1,
      })
      const doc = result.docs[0] as unknown as ServiceDoc | undefined
      if (!doc) return null
      doc._isFallback = await isLocaleFallback('services', doc.id, locale)
      return doc
    } catch {
      return null
    }
  },
  ['service-by-slug'],
  { revalidate: 60, tags: [tags.services()] },
)

export const getServicePillars = unstable_cache(
  async (locale: string): Promise<PaginatedResult<ServicePillarDoc>> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'service-pillars',
        sort: 'order',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit: 20,
      })
      return result as unknown as PaginatedResult<ServicePillarDoc>
    } catch {
      return empty<ServicePillarDoc>()
    }
  },
  ['service-pillars'],
  { revalidate: 3600, tags: [tags.services()] },
)

// ─── Guide ───────────────────────────────────────────────────────────────────

/**
 * Topics for the public topic grid — filtered to topics with at least one
 * published article (BRIEF-AMENDMENT-01 §2.8: GuideTopics has no reviewStatus
 * of its own, so without this filter all topics would be publicly "live" the
 * moment they're created, with nothing behind them).
 */
export const getGuideTopics = unstable_cache(
  async (locale: string, limit = 50): Promise<GuideTopicDoc[]> => {
    try {
      const payload = await getPayloadClient()
      const topics = await payload.find({
        collection: 'guide-topics',
        sort: 'order',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: 50,
      })
      const withArticles = await Promise.all(
        topics.docs.map(async (topic) => {
          const count = await payload.count({
            collection: 'guide-articles',
            where: {
              and: [
                { topic: { equals: topic.id } },
                { reviewStatus: { equals: 'published' } },
              ],
            },
          })
          return count.totalDocs > 0 ? topic : null
        }),
      )
      return (withArticles.filter((t): t is NonNullable<typeof t> => t !== null) as unknown as GuideTopicDoc[]).slice(0, limit)
    } catch {
      return []
    }
  },
  ['guide-topics'],
  { revalidate: 3600, tags: [tags.guide()] },
)

/** A topic by slug — found even with zero published articles (empty state, not 404). */
export const getGuideTopicBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<GuideTopicDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'guide-topics',
        where: { slug: { equals: slug } },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: 1,
      })
      return (result.docs[0] as unknown as GuideTopicDoc) ?? null
    } catch {
      return null
    }
  },
  ['guide-topic-by-slug'],
  { revalidate: 3600, tags: [tags.guide()] },
)

export const getGuideArticlesByTopic = unstable_cache(
  async (topicSlug: string, locale: string, page = 1): Promise<PaginatedResult<GuideArticleDoc>> => {
    try {
      const payload = await getPayloadClient()
      const topicResult = await payload.find({
        collection: 'guide-topics',
        where: { slug: { equals: topicSlug } },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: 1,
      })
      const topic = topicResult.docs[0]
      if (!topic) return empty<GuideArticleDoc>()

      const result = await payload.find({
        collection: 'guide-articles',
        where: {
          and: [
            { topic: { equals: topic.id } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        sort: 'title',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit: 9,
        page,
      })
      return result as unknown as PaginatedResult<GuideArticleDoc>
    } catch {
      return empty<GuideArticleDoc>()
    }
  },
  ['guide-articles-by-topic'],
  { revalidate: 60, tags: [tags.guide()] },
)

export const getGuideArticleBySlug = unstable_cache(
  async (topicSlug: string, articleSlug: string, locale: string): Promise<GuideArticleDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const topicResult = await payload.find({
        collection: 'guide-topics',
        where: { slug: { equals: topicSlug } },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: 1,
      })
      const topic = topicResult.docs[0]
      if (!topic) return null

      const result = await payload.find({
        collection: 'guide-articles',
        where: {
          and: [
            { slug: { equals: articleSlug } },
            { topic: { equals: topic.id } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit: 1,
      })
      const doc = result.docs[0] as unknown as GuideArticleDoc | undefined
      if (!doc) return null
      doc._isFallback = await isLocaleFallback('guide-articles', doc.id, locale)
      return doc
    } catch {
      return null
    }
  },
  ['guide-article-by-slug'],
  { revalidate: 60, tags: [tags.guide()] },
)

// ─── Roadmaps ──────────────────────────────────────────────────────────────────

/** Published roadmaps only — a flat list, no parent (BRIEF-AMENDMENT-01 §2.8 empty-state principle). */
export const getRoadmaps = unstable_cache(
  async (locale: string, limit = 100): Promise<RoadmapDoc[]> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'roadmaps',
        where: { reviewStatus: { equals: 'published' } },
        sort: 'title',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit,
      })
      return result.docs as unknown as RoadmapDoc[]
    } catch {
      return []
    }
  },
  ['roadmaps'],
  { revalidate: 3600, tags: [tags.roadmaps()] },
)

export const getRoadmapBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<RoadmapDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'roadmaps',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
        limit: 1,
      })
      const doc = result.docs[0] as unknown as RoadmapDoc | undefined
      if (!doc) return null
      doc._isFallback = await isLocaleFallback('roadmaps', doc.id, locale)
      return doc
    } catch {
      return null
    }
  },
  ['roadmap-by-slug'],
  { revalidate: 60, tags: [tags.roadmaps()] },
)

// ─── Experts ───────────────────────────────────────────────────────────────────

export const getExpertCategories = unstable_cache(
  async (): Promise<Array<{ id: string; name?: string | null; slug?: string | null }>> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        where: { type: { equals: 'expert' } },
        sort: 'name',
        depth: 0,
        limit: 50,
      })
      return result.docs.map((d: { id: string | number; name?: string | null; slug?: string | null }) => ({
        id: String(d.id),
        name: d.name,
        slug: d.slug,
      }))
    } catch {
      return []
    }
  },
  ['expert-categories'],
  { revalidate: 3600, tags: ['categories'] },
)

/** Published + verified experts only, optionally filtered by category slug. */
export const getExperts = unstable_cache(
  async (locale: string, categorySlug?: string, limit = 100): Promise<ExpertDoc[]> => {
    try {
      const payload = await getPayloadClient()
      const conditions: Where[] = [{ reviewStatus: { equals: 'published' } }]

      if (categorySlug) {
        const catResult = await payload.find({
          collection: 'categories',
          where: { and: [{ slug: { equals: categorySlug } }, { type: { equals: 'expert' } }] },
          depth: 0,
          limit: 1,
        })
        const cat = catResult.docs[0]
        if (!cat) return []
        conditions.push({ categories: { equals: cat.id } })
      }

      const result = await payload.find({
        collection: 'experts',
        where: { and: conditions },
        sort: 'name',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit,
      })
      return result.docs as unknown as ExpertDoc[]
    } catch {
      return []
    }
  },
  ['experts'],
  { revalidate: 3600, tags: [tags.experts()] },
)

export const getExpertBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<ExpertDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'experts',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit: 1,
      })
      return (result.docs[0] as unknown as ExpertDoc) ?? null
    } catch {
      return null
    }
  },
  ['expert-by-slug'],
  { revalidate: 60, tags: [tags.experts()] },
)

// ─── Homepage stats band ───────────────────────────────────────────────────────

export type HomeStatSource = 'experts' | 'guideArticles' | 'roadmaps' | 'events'

/**
 * Count-only queries (`payload.count`, never a full `find`) for the homepage stats band's
 * dynamic tiles — BRIEF-AMENDMENT-02 §2.7: "never fetch a full collection to read a count."
 * Not locale-scoped: these are trust-signal totals of the association's work, not per-locale
 * content, and localized fields fall back to German anyway so a count wouldn't meaningfully
 * differ by locale.
 */
export const getHomeStatCounts = unstable_cache(
  async (): Promise<Record<HomeStatSource, number>> => {
    try {
      const payload = await getPayloadClient()
      const [experts, guideArticles, roadmaps, events] = await Promise.all([
        payload.count({ collection: 'experts', where: { reviewStatus: { equals: 'published' } } }),
        payload.count({ collection: 'guide-articles', where: { reviewStatus: { equals: 'published' } } }),
        payload.count({ collection: 'roadmaps', where: { reviewStatus: { equals: 'published' } } }),
        payload.count({ collection: 'events', where: { reviewStatus: { equals: 'published' } } }),
      ])
      return {
        experts: experts.totalDocs,
        guideArticles: guideArticles.totalDocs,
        roadmaps: roadmaps.totalDocs,
        events: events.totalDocs,
      }
    } catch {
      return { experts: 0, guideArticles: 0, roadmaps: 0, events: 0 }
    }
  },
  ['home-stat-counts'],
  { revalidate: 3600, tags: [tags.experts(), tags.guide(), tags.roadmaps(), tags.events()] },
)

// ─── Site settings + Partners ─────────────────────────────────────────────────

export const getSiteSettings = unstable_cache(
  async (locale: string): Promise<SiteSettingsDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.findGlobal({
        slug: 'site-settings',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
      })
      return result as unknown as SiteSettingsDoc
    } catch {
      return null
    }
  },
  ['site-settings'],
  { revalidate: 3600, tags: [tags.siteSettings()] },
)

export const getPartners = unstable_cache(
  async (): Promise<PartnerDoc[]> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'partners',
        sort: 'order',
        depth: 2,
        limit: 100,
      })
      return result.docs as unknown as PartnerDoc[]
    } catch {
      return []
    }
  },
  ['partners'],
  { revalidate: 3600, tags: ['partners'] },
)
