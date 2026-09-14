import type { Payload } from 'payload'

/** Lowercase, ASCII, hyphen-separated — safe for a URL segment. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/**
 * Slugify `input` and, if the result already exists in `collection`, append
 * `-2`, `-3`, ... until it's unique. Used where the slug is derived from
 * user-submitted free text (e.g. a name) rather than typed by an editor.
 */
export async function uniqueSlug(payload: Payload, collection: string, input: string): Promise<string> {
  const base = slugify(input) || 'eintrag'
  let candidate = base
  let suffix = 2
  while (true) {
    const existing = await payload.find({
      collection: collection as never,
      where: { slug: { equals: candidate } },
      depth: 0,
      limit: 1,
    })
    if (existing.docs.length === 0) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}
