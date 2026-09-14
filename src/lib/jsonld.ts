/**
 * schema.org structured data builders.
 * Each function returns a plain object — serialize to JSON with JSON.stringify
 * and inject into a <script type="application/ld+json"> tag.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SVÖ — Syrischer Verband in Österreich',
    url: BASE_URL,
    sameAs: [],
  }
}

export function newsArticleSchema({
  title,
  description,
  imageUrl,
  datePublished,
  dateModified,
  author,
  url,
  locale,
}: {
  title: string
  description?: string | null
  imageUrl?: string | null
  datePublished?: string | null
  dateModified?: string | null
  author?: string | null
  url: string
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: {
      '@type': author ? 'Person' : 'Organization',
      name: author ?? 'SVÖ',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SVÖ — Syrischer Verband in Österreich',
      url: BASE_URL,
    },
    url,
    inLanguage: locale,
    isAccessibleForFree: true,
  }
}

export function guideArticleSchema({
  title,
  description,
  imageUrl,
  dateModified,
  url,
  locale,
}: {
  title: string
  description?: string | null
  imageUrl?: string | null
  dateModified?: string | null
  url: string
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: { '@type': 'Organization', name: 'SVÖ — Syrischer Verband in Österreich' },
    publisher: {
      '@type': 'Organization',
      name: 'SVÖ — Syrischer Verband in Österreich',
      url: BASE_URL,
    },
    url,
    inLanguage: locale,
    isAccessibleForFree: true,
  }
}

export function roadmapSchema({
  title,
  description,
  dateModified,
  url,
  locale,
  steps,
}: {
  title: string
  description?: string | null
  dateModified?: string | null
  url: string
  locale: string
  steps: { name: string; text: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: title,
    ...(description ? { description } : {}),
    ...(dateModified ? { dateModified } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
    url,
    inLanguage: locale,
  }
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function serviceSchemaLD({
  name,
  description,
  url,
}: {
  name: string
  description?: string | null
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    ...(description ? { description } : {}),
    provider: {
      '@type': 'Organization',
      name: 'SVÖ — Syrischer Verband in Österreich',
      url: BASE_URL,
    },
    areaServed: { '@type': 'Country', name: 'Austria' },
    url,
  }
}

export function eventSchema({
  title,
  description,
  imageUrl,
  startDate,
  endDate,
  locationName,
  address,
  isOnline,
  isFree,
  url,
  locale,
}: {
  title: string
  description?: string | null
  imageUrl?: string | null
  startDate: string
  endDate?: string | null
  locationName?: string | null
  address?: string | null
  isOnline?: boolean | null
  isFree?: boolean | null
  url: string
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    startDate,
    ...(endDate ? { endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: isOnline
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: isOnline
      ? { '@type': 'VirtualLocation', url }
      : {
          '@type': 'Place',
          name: locationName,
          ...(address ? { address: { '@type': 'PostalAddress', streetAddress: address } } : {}),
        },
    offers: {
      '@type': 'Offer',
      price: isFree !== false ? '0' : undefined,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url,
    },
    organizer: {
      '@type': 'Organization',
      name: 'SVÖ — Syrischer Verband in Österreich',
      url: BASE_URL,
    },
    url,
    inLanguage: locale,
  }
}
