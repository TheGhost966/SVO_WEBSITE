import { serializeJsonLd } from '@/lib/jsonld'

/**
 * The one place a JSON-LD block is emitted (QA S17). Every page passes its schema.org object here
 * instead of writing a script element with stringified JSON itself, so the escaping in
 * `serializeJsonLd` can't be forgotten at a call site.
 */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}
