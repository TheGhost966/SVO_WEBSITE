import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { tags } from '@/lib/payload'

// Next.js 16 requires a second `profile` argument for revalidateTag.
// `{ expire: 0 }` means "expire immediately on next request".
const IMMEDIATE = { expire: 0 }

function bust(tag: string) {
  revalidateTag(tag, IMMEDIATE)
}

/**
 * Fires after any change to a publishable collection document.
 * When a document moves into or out of 'published', blows the ISR cache
 * so the public site reflects the change within the next request cycle.
 *
 * Works because Payload 3.x runs inside the same Next.js process,
 * so `revalidateTag` from `next/cache` is available directly.
 * Wrapped in try/catch so it doesn't break Payload CLI commands that run
 * outside of a Next.js request context (migrations, seed scripts).
 */
export function makeRevalidateOnPublish(collection: string): CollectionAfterChangeHook {
  return ({ doc, previousDoc }) => {
    // Collections without a reviewStatus field (e.g. service-pillars — no
    // draft/publish workflow, always publicly readable) have nothing to
    // "transition" — always revalidate on any change. Collections that do
    // have the field only need a cache bust when publish status actually
    // changes; without this check, `undefined === undefined` would always
    // be true and the hook would never revalidate at all for those.
    const hasReviewStatus = Boolean(doc && 'reviewStatus' in doc)
    if (hasReviewStatus) {
      const wasPublished = previousDoc?.reviewStatus === 'published'
      const isPublished = doc?.reviewStatus === 'published'
      if (wasPublished === isPublished) return doc
    }

    try {
      // Blow the collection list cache
      switch (collection) {
        case 'news':
          bust(tags.news())
          break
        case 'events':
          bust(tags.events())
          break
        case 'services':
        case 'service-pillars':
          bust(tags.services())
          break
        case 'pages':
          bust(tags.pages())
          break
        case 'guide-topics':
        case 'guide-articles':
          bust(tags.guide())
          break
        case 'roadmaps':
          bust(tags.roadmaps())
          break
        case 'experts':
          bust(tags.experts())
          break
      }

      // Blow per-slug caches across all locales
      const slugSource = doc?.slug ?? previousDoc?.slug
      const slugs = new Set<string>()

      if (typeof slugSource === 'string' && slugSource) {
        slugs.add(slugSource)
      } else if (slugSource && typeof slugSource === 'object') {
        Object.values(slugSource as Record<string, unknown>)
          .filter((v): v is string => typeof v === 'string' && Boolean(v))
          .forEach((s) => slugs.add(s))
      }

      for (const slug of slugs) {
        for (const locale of ['de', 'ar', 'en']) {
          switch (collection) {
            case 'news':
              bust(tags.newsItem(slug, locale))
              break
            case 'events':
              bust(tags.eventsItem(slug, locale))
              break
          }
        }
      }
    } catch {
      // Outside Next.js context (CLI, migrations) — revalidateTag is a no-op
    }

    return doc
  }
}

/**
 * Same cache-busting for deletes. `afterChange` alone never fires when a document is deleted, so a
 * deleted published item kept showing on the public site until its cache entry expired (up to an
 * hour for roadmaps/experts). Reuses the change hook: with no `previousDoc`, a deleted *published*
 * doc reads as a published→gone transition (busts); a deleted draft reads as no change (skips).
 */
export function makeRevalidateOnDelete(collection: string): CollectionAfterDeleteHook {
  const onChange = makeRevalidateOnPublish(collection)
  return async (args) => {
    await onChange({ ...args, data: args.doc, previousDoc: undefined, operation: 'update' } as never)
    return args.doc
  }
}
