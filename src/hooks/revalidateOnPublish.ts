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
 * Whenever the document is, or just was, 'published', blows the ISR cache
 * so the public site reflects the change within the next request cycle:
 * publishing, unpublishing/archiving, and every edit to a published document.
 * Only a change that stays unpublished (draft → draft, draft → in review)
 * has nothing to show and is skipped.
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
    // have the field are skipped only while the document stays unpublished.
    // This used to compare the two states and skip when they were equal,
    // which also skipped published → published: an edit to a live document
    // never reached the site (qa/security/prod-propagation.test.ts).
    const hasReviewStatus = Boolean(doc && 'reviewStatus' in doc)
    if (hasReviewStatus) {
      const wasPublished = previousDoc?.reviewStatus === 'published'
      const isPublished = doc?.reviewStatus === 'published'
      if (!wasPublished && !isPublished) return doc
    }

    try {
      // One tag per collection covers its lists and its detail pages (src/lib/queries.ts)
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
        case 'jobs':
          bust(tags.jobs())
          break
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
