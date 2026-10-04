import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'
import { getPayloadClient, tags } from './payload'
import type { NewsDoc, EventDoc, JobDoc, ServicePillarDoc, ServiceDoc, PageDoc, SiteSettingsDoc, PartnerDoc, GuideTopicDoc, GuideArticleDoc,
  GuideRelatedLink, RoadmapDoc, ExpertDoc } from '@/types/payload'

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
      if (result.docs[0] || locale === 'de') return (result.docs[0] as unknown as PageDoc) ?? null

      // `slug` is localized, so a page that only has its German slug is not found in Arabic or
      // English — the About page then showed its "content pending" placeholder there although the
      // German page was published. Find it by its German slug and read it in the requested
      // locale; untranslated fields fall back to German like everywhere else on the site.
      const german = await payload.find({
        collection: 'pages',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
          ],
        },
        locale: 'de',
        depth: 0,
        limit: 1,
      })
      if (!german.docs[0]) return null
      const page = await payload.findByID({
        collection: 'pages',
        id: german.docs[0].id,
        locale: locale as 'de' | 'ar' | 'en',
        depth: 3,
        disableErrors: true,
      })
      return (page as unknown as PageDoc) ?? null
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
  { revalidate: 60, tags: [tags.news()] },
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
  { revalidate: 3600, tags: [tags.categories()] },
)

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
  { revalidate: 3600, tags: [tags.categories()] },
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
/** Upper bound for the topic grid — GuideTopics is a short, fixed reference list. */
const MAX_GUIDE_TOPICS = 50

export const getGuideTopics = unstable_cache(
  async (locale: string, limit = 50): Promise<GuideTopicDoc[]> => {
    try {
      const payload = await getPayloadClient()
      // "Which topics have at least one published article?" — a DISTINCT over the join column.
      // The answer is bounded by the number of topics, not the number of articles; the previous
      // version read every published article (`pagination: false`) on each homepage render to get
      // it, which BRIEF-AMENDMENT-02 §2.7 rules out.
      const withArticles = await payload.findDistinct({
        collection: 'guide-articles',
        field: 'topic',
        where: { reviewStatus: { equals: 'published' } },
        depth: 0,
        limit: MAX_GUIDE_TOPICS,
      })
      const topicIds = withArticles.values
        .map((row) => {
          const topic = (row as { topic?: unknown }).topic
          // `depth: 0` leaves the relationship as a raw id, but an object shape is still
          // possible — normalise both to the plain id.
          if (topic && typeof topic === 'object' && 'id' in topic) return (topic as { id: number | string }).id
          return topic == null ? null : (topic as number | string)
        })
        .filter((id): id is number | string => id !== null)
      if (topicIds.length === 0) return []

      // The caller's limit goes into the query, not into a slice() of a larger result.
      const topics = await payload.find({
        collection: 'guide-topics',
        where: { id: { in: topicIds } },
        sort: 'order',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 0,
        limit: Math.min(limit, MAX_GUIDE_TOPICS),
      })
      return topics.docs as unknown as GuideTopicDoc[]
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

      // Cross-links (BRIEF-AMENDMENT-01 §3). The Local API populates relations regardless of their
      // review status, and a populated expert carries private contact data — so keep only
      // published targets, and of those only title and slug.
      type Rel = { title?: string | null; name?: string | null; slug?: string | null; reviewStatus?: string | null; pillar?: unknown }
      const published = (list: unknown): Rel[] =>
        (Array.isArray(list) ? list : []).filter((r): r is Rel => Boolean(r) && typeof r === 'object' && (r as Rel).reviewStatus === 'published' && Boolean((r as Rel).slug))
      const related: GuideRelatedLink[] = []
      for (const r of published(doc.relatedRoadmaps)) related.push({ kind: 'roadmap', title: r.title ?? r.slug!, slug: r.slug! })
      for (const r of published(doc.relatedServices)) {
        const pillarSlug = r.pillar && typeof r.pillar === 'object' ? (r.pillar as { slug?: string | null }).slug : null
        if (pillarSlug) related.push({ kind: 'service', title: r.title ?? r.slug!, slug: r.slug!, pillarSlug })
      }
      for (const r of published(doc.relatedExperts)) related.push({ kind: 'expert', title: r.name ?? r.slug!, slug: r.slug! })
      doc._related = related
      delete doc.relatedRoadmaps
      delete doc.relatedServices
      delete doc.relatedExperts
      return doc
    } catch {
      return null
    }
  },
  ['guide-article-by-slug'],
  // The page prints titles of roadmaps, services and experts, so a change there has to refresh it.
  { revalidate: 60, tags: [tags.guide(), tags.roadmaps(), tags.services(), tags.experts()] },
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
  { revalidate: 3600, tags: [tags.categories()] },
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

// ─── Site search ────────────────────────────────────────────────────────────

export type SearchResults = {
  news: NewsDoc[]
  events: EventDoc[]
  roadmaps: RoadmapDoc[]
  guideArticles: GuideArticleDoc[]
  experts: ExpertDoc[]
}

/**
 * Backs the hero search bar (`/search?q=`) — a real `like` (case-insensitive, partial) match on
 * each collection's title/name field, published items only, capped at 5 per collection. Not
 * wrapped in `unstable_cache`: the cache key would be the raw query string, so every distinct
 * search would grow the cache indefinitely for no benefit on a low-traffic site.
 */
const EMPTY_SEARCH: SearchResults = { news: [], events: [], roadmaps: [], guideArticles: [], experts: [] }

/**
 * The only query in this file that used to run uncached: five `find`s straight to Postgres on
 * every hit of `/search?q=…`, which any visitor can trigger with an arbitrary string. Caching by
 * (locale, query, limit) means a repeated or shared search costs nothing, and a burst of traffic
 * on one term collapses to a single round trip. Five minutes — long enough to absorb a spike,
 * short enough that newly published content shows up without a deploy.
 */
const searchSiteCached = unstable_cache(
  async (locale: string, q: string, limitPerType: number): Promise<SearchResults> => {
    try {
      const payload = await getPayloadClient()
      const loc = locale as 'de' | 'ar' | 'en'
      const [news, events, roadmaps, guideArticles, experts] = await Promise.all([
        payload.find({
          collection: 'news',
          where: { and: [{ reviewStatus: { equals: 'published' } }, { title: { like: q } }] },
          locale: loc,
          depth: 1,
          limit: limitPerType,
        }),
        payload.find({
          collection: 'events',
          where: { and: [{ reviewStatus: { equals: 'published' } }, { title: { like: q } }] },
          locale: loc,
          depth: 1,
          limit: limitPerType,
        }),
        payload.find({
          collection: 'roadmaps',
          where: { and: [{ reviewStatus: { equals: 'published' } }, { title: { like: q } }] },
          locale: loc,
          depth: 0,
          limit: limitPerType,
        }),
        payload.find({
          collection: 'guide-articles',
          where: { and: [{ reviewStatus: { equals: 'published' } }, { title: { like: q } }] },
          locale: loc,
          depth: 1,
          limit: limitPerType,
        }),
        payload.find({
          collection: 'experts',
          where: { and: [{ reviewStatus: { equals: 'published' } }, { name: { like: q } }] },
          locale: loc,
          depth: 0,
          limit: limitPerType,
        }),
      ])
      return {
        news: news.docs as unknown as NewsDoc[],
        events: events.docs as unknown as EventDoc[],
        roadmaps: roadmaps.docs as unknown as RoadmapDoc[],
        guideArticles: guideArticles.docs as unknown as GuideArticleDoc[],
        experts: experts.docs as unknown as ExpertDoc[],
      }
    } catch {
      return EMPTY_SEARCH
    }
  },
  ['site-search'],
  {
    revalidate: 300,
    tags: [tags.news(), tags.events(), tags.roadmaps(), tags.guide(), tags.experts()],
  },
)

export async function searchSite(locale: string, query: string, limitPerType = 5): Promise<SearchResults> {
  // Normalise before it reaches the cache key so `Wien`, `wien ` and `  WIEN` are one entry
  // rather than three, and cap the length so a long random string can't mint unbounded entries.
  const q = query.trim().slice(0, 100).toLowerCase()
  if (!q) return EMPTY_SEARCH
  return searchSiteCached(locale, q, limitPerType)
}

// ─── Site settings + Partners ─────────────────────────────────────────────────

export const getSiteSettings = unstable_cache(
  async (locale: string): Promise<SiteSettingsDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const result = (await payload.findGlobal({
        slug: 'site-settings',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 2,
      })) as unknown as SiteSettingsDoc
      if (locale === 'de') return result

      // Homepage copy has built-in texts in all three languages (components/home/copy.ts). With
      // Payload's locale fallback an empty Arabic or English field came back holding the German
      // text, which then replaced the built-in Arabic / English wording. So the homepage group is
      // read without fallback: an empty field stays empty and the built-in text of THIS locale is
      // used. Everything else in the global keeps the German fallback.
      const strict = (await payload.findGlobal({
        slug: 'site-settings',
        locale: locale as 'ar' | 'en',
        fallbackLocale: false,
        depth: 2,
      })) as unknown as SiteSettingsDoc
      return { ...result, homeGroup: strict.homeGroup }
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
  { revalidate: 3600, tags: [tags.partners()] },
)

// ─── Jobs ─────────────────────────────────────────────────────────────────────

/**
 * Published, unexpired postings only.
 *
 * The expiry filter lives here rather than in a cleanup job because it has to be true of every
 * read: a stored `expiryDate` that nothing checks is just a note (BRIEF-AMENDMENT-01 §2.5), and
 * the Jobs slice was originally scoped down precisely because nobody was named to prune stale
 * postings by hand. With the filter in the query, a posting stops being public on its expiry date
 * whether or not anyone remembers.
 *
 * `revalidate: 300` rather than the usual 3600: a cached list outlives the moment a posting
 * expires, and five minutes is a tolerable window for showing a job that closed today.
 */
export const getJobs = unstable_cache(
  async (locale: string, limit = 50): Promise<JobDoc[]> => {
    try {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()
      const result = await payload.find({
        collection: 'jobs',
        where: {
          and: [
            { reviewStatus: { equals: 'published' } },
            { expiryDate: { greater_than: now } },
          ],
        },
        sort: '-publishedAt',
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit,
      })
      return result.docs as unknown as JobDoc[]
    } catch {
      return []
    }
  },
  ['jobs'],
  { revalidate: 300, tags: [tags.jobs()] },
)

export const getJobBySlug = unstable_cache(
  async (slug: string, locale: string): Promise<JobDoc | null> => {
    try {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()
      const result = await payload.find({
        collection: 'jobs',
        where: {
          and: [
            { slug: { equals: slug } },
            { reviewStatus: { equals: 'published' } },
            // An expired posting 404s rather than rendering — otherwise a shared or indexed link
            // keeps serving a closed vacancy long after it left the listing.
            { expiryDate: { greater_than: now } },
          ],
        },
        locale: locale as 'de' | 'ar' | 'en',
        depth: 1,
        limit: 1,
      })
      return (result.docs[0] as unknown as JobDoc) ?? null
    } catch {
      return null
    }
  },
  ['job-by-slug'],
  { revalidate: 300, tags: [tags.jobs()] },
)

/** Slugs for `generateStaticParams` — same expiry rule, so expired postings stop being prerendered. */
export const getJobSlugs = unstable_cache(
  async (): Promise<string[]> => {
    try {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()
      const result = await payload.find({
        collection: 'jobs',
        where: {
          and: [
            { reviewStatus: { equals: 'published' } },
            { expiryDate: { greater_than: now } },
          ],
        },
        depth: 0,
        limit: 200,
        select: { slug: true },
      })
      return result.docs.map((d) => (d as { slug?: string }).slug).filter((v): v is string => Boolean(v))
    } catch {
      return []
    }
  },
  ['job-slugs'],
  { revalidate: 300, tags: [tags.jobs()] },
)
