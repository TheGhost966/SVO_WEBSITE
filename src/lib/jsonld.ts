/**
 * schema.org structured data builders.
 * Each function returns a plain object. Render it with <JsonLd data={…} />
 * (src/components/ui/JsonLd.tsx) — never with JSON.stringify into a <script> by hand.
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

/**
 * `JobPosting` structured data — the reason each posting gets its own indexable page rather than
 * the listing linking straight out to `applyUrl` (BRIEF-AMENDMENT-01 §2.4).
 *
 * `validThrough` mirrors the posting's own expiry, so search engines retire the listing on the
 * same date the site stops serving it. No salary is emitted: the collection has no salary field,
 * and `baseSalary` is exactly the kind of value that must never be guessed.
 */
export function jobPostingSchema({
  title,
  description,
  organisation,
  city,
  region,
  datePosted,
  validThrough,
  employmentType,
  url,
}: {
  title: string
  description?: string | null
  organisation?: string | null
  city?: string | null
  region?: string | null
  datePosted?: string | null
  validThrough?: string | null
  employmentType?: string | null
  url: string
}) {
  // schema.org's controlled vocabulary, not our internal field values.
  const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
    full_time: 'FULL_TIME',
    part_time: 'PART_TIME',
    apprenticeship: 'OTHER',
    internship: 'INTERN',
    volunteer: 'VOLUNTEER',
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    ...(description ? { description } : {}),
    ...(datePosted ? { datePosted } : {}),
    ...(validThrough ? { validThrough } : {}),
    ...(employmentType && EMPLOYMENT_TYPE_MAP[employmentType]
      ? { employmentType: EMPLOYMENT_TYPE_MAP[employmentType] }
      : {}),
    ...(organisation
      ? { hiringOrganization: { '@type': 'Organization', name: organisation } }
      : {}),
    ...(city || region
      ? {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              ...(city ? { addressLocality: city } : {}),
              ...(region ? { addressRegion: region } : {}),
              addressCountry: 'AT',
            },
          },
        }
      : {}),
    url,
  }
}

// ─── Serialisation (QA S17) ───────────────────────────────────────────────────

const JSON_LD_ESCAPES: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * JSON for the inside of a JSON-LD script element (rendered by src/components/ui/JsonLd.tsx).
 *
 * Plain `JSON.stringify` is not enough there: the HTML parser ends the element at the first
 * `</script` it sees, wherever it is, so a title containing `</script><script>…` closes the data
 * block and starts a real script (stored XSS from any editor account). `<`, `>` and `&` are
 * written as \uXXXX escapes — still the same JSON string to every parser, but inert to HTML —
 * and so are U+2028/U+2029, which are valid in JSON but line terminators to older JS engines.
 */
export function serializeJsonLd(data: unknown): string {
  return (JSON.stringify(data) ?? 'null').replace(/[<>&\u2028\u2029]/g, (char) => JSON_LD_ESCAPES[char])
}
