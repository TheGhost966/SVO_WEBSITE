import { unstable_cache } from 'next/cache'
import { getPayloadClient, tags } from './payload'
import type { NewsDoc, EventDoc, ServicePillarDoc, PageDoc } from '@/types/payload'

type PaginatedResult<T> = { docs: T[]; totalDocs: number; hasNextPage: boolean }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function empty<T>(): PaginatedResult<T> {
  return { docs: [], totalDocs: 0, hasNextPage: false }
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { reviewStatus: { equals: 'published' } }
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
      return (result.docs[0] as unknown as NewsDoc) ?? null
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

// ─── Services ─────────────────────────────────────────────────────────────────

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
