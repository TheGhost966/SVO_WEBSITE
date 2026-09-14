import { getPayload } from 'payload'
import config from '@payload-config'
import { cache } from 'react'

/**
 * Returns a cached Payload instance for use in React Server Components.
 * The `cache()` wrapper means one instance per request — safe for concurrent requests.
 */
export const getPayloadClient = cache(async () => getPayload({ config }))

/** Standard ISR revalidation tag helpers — use with Next.js `revalidateTag` */
export const tags = {
  news: (locale?: string) => (locale ? `news-${locale}` : 'news'),
  newsItem: (slug: string, locale: string) => `news-${slug}-${locale}`,
  events: (locale?: string) => (locale ? `events-${locale}` : 'events'),
  eventsItem: (slug: string, locale: string) => `events-${slug}-${locale}`,
  services: (locale?: string) => (locale ? `services-${locale}` : 'services'),
  pages: (locale?: string) => (locale ? `pages-${locale}` : 'pages'),
  navigation: (locale?: string) => (locale ? `navigation-${locale}` : 'navigation'),
  siteSettings: () => 'site-settings',
}
