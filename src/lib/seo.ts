import type { Metadata } from 'next'

type SeoDoc = {
  seo?: {
    title?: string | null
    description?: string | null
    ogImage?: { filename?: string | null } | string | null
    noIndex?: boolean | null
  }
  title?: string | Record<string, string> | null
  excerpt?: string | Record<string, string> | null
}

type SeoOptions = {
  doc: SeoDoc
  locale: string
  fallbackTitle?: string
  serverUrl?: string
}

function resolveString(
  value: string | Record<string, string> | null | undefined,
): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  return value.de ?? Object.values(value)[0] ?? null
}

export function buildMetadata({ doc, locale, fallbackTitle, serverUrl }: SeoOptions): Metadata {
  const base = serverUrl ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

  const seoTitle = doc.seo?.title || resolveString(doc.title) || fallbackTitle || 'SVÖ'
  const seoDesc = doc.seo?.description || resolveString(doc.excerpt) || undefined

  const ogImage = doc.seo?.ogImage
  const ogImageUrl =
    ogImage && typeof ogImage === 'object' && ogImage.filename
      ? `${base}/media/${ogImage.filename}`
      : undefined

  return {
    title: seoTitle,
    description: seoDesc,
    robots: doc.seo?.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
      locale,
      type: 'website',
    },
  }
}

/** Build hreflang link tags for <head> */
export function buildAlternates(
  pathsByLocale: Record<string, string>,
  base?: string,
): Metadata['alternates'] {
  const serverUrl = base ?? process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  const languages: Record<string, string> = {}
  for (const [loc, path] of Object.entries(pathsByLocale)) {
    languages[loc] = `${serverUrl}${path}`
  }
  return { languages }
}
