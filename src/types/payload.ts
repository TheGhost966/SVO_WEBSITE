/**
 * Hand-written types that mirror the Payload collection schemas.
 * The generated `payload-types.ts` supersedes these once `npm run generate:types` is run
 * (requires a connected database). Until then these keep TypeScript happy.
 */

export type ResolvedMedia = {
  id: string
  filename?: string | null
  alt?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  url?: string | null
  sizes?: {
    thumbnail?: { url?: string | null; width?: number | null; height?: number | null } | null
    card?: { url?: string | null; width?: number | null; height?: number | null } | null
    hero?: { url?: string | null; width?: number | null; height?: number | null } | null
  } | null
}

export type CategoryRef = { id: string; name?: string | null; slug?: string | null }

export type NewsDoc = {
  id: string
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  coverImage?: ResolvedMedia | string | null
  category?: CategoryRef | string | null
  author?: string | null
  reviewStatus?: string | null
}

export type EventDoc = {
  id: string
  title?: string | null
  slug?: string | null
  description?: unknown
  startDate?: string | null
  endDate?: string | null
  locationName?: string | null
  address?: string | null
  isOnline?: boolean | null
  isFree?: boolean | null
  coverImage?: ResolvedMedia | string | null
  category?: CategoryRef | string | null
  reviewStatus?: string | null
}

export type ServicePillarDoc = {
  id: string
  title?: string | null
  slug?: string | null
  description?: string | null
  icon?: string | null
  colourToken?: string | null
  order?: number | null
}

// ─── Block types ─────────────────────────────────────────────────────────────

export type HeroBlock = {
  blockType: 'hero'
  id?: string
  heading?: string | null
  subheading?: string | null
  body?: string | null
  image?: ResolvedMedia | string | null
  cta?: { label?: string | null; url?: string | null } | null
  variant?: 'default' | 'image' | 'compact'
}

export type RichTextPayloadBlock = {
  blockType: 'rich-text'
  id?: string
  content?: unknown
  width?: 'default' | 'wide'
}

export type ImageTextBlock = {
  blockType: 'image-text'
  id?: string
  image?: ResolvedMedia | string | null
  heading?: string | null
  body?: unknown
  imagePosition?: 'start' | 'end'
  cta?: { label?: string | null; url?: string | null } | null
}

export type CardGridBlock = {
  blockType: 'card-grid'
  id?: string
  heading?: string | null
  subheading?: string | null
  cards?: Array<{
    id?: string
    icon?: string | null
    image?: ResolvedMedia | string | null
    heading?: string | null
    body?: string | null
    url?: string | null
    linkLabel?: string | null
  }>
  columns?: '2' | '3' | '4'
}

export type StatsBlock = {
  blockType: 'stats'
  id?: string
  heading?: string | null
  stats?: Array<{ id?: string; value?: string | null; label?: string | null; description?: string | null }>
  variant?: 'light' | 'dark' | 'green'
}

export type CTABandBlock = {
  blockType: 'cta-band'
  id?: string
  heading?: string | null
  subheading?: string | null
  primaryCta?: { label?: string | null; url?: string | null } | null
  secondaryCta?: { label?: string | null; url?: string | null } | null
  variant?: 'green' | 'navy' | 'blue'
}

export type FAQPayloadBlock = {
  blockType: 'faq'
  id?: string
  heading?: string | null
  items?: Array<{ id?: string; question?: string | null; answer?: unknown }>
}

export type LogoGridBlock = {
  blockType: 'logo-grid'
  id?: string
  heading?: string | null
  logos?: Array<{ id?: string; image?: ResolvedMedia | string | null; name?: string | null; url?: string | null }>
}

export type TimelineBlock = {
  blockType: 'timeline'
  id?: string
  heading?: string | null
  items?: Array<{ id?: string; year?: string | null; title?: string | null; description?: string | null }>
}

export type PageBlock =
  | HeroBlock
  | RichTextPayloadBlock
  | ImageTextBlock
  | CardGridBlock
  | StatsBlock
  | CTABandBlock
  | FAQPayloadBlock
  | LogoGridBlock
  | TimelineBlock

export type PageDoc = {
  id: string
  title?: string | null
  slug?: string | null
  layout?: PageBlock[] | null
  seo?: {
    title?: string | null
    description?: string | null
    ogImage?: ResolvedMedia | string | null
    noIndex?: boolean | null
  } | null
}
