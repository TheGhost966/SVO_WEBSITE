/**
 * Shared helpers for the seed scripts.
 *
 * Extracted from `seed/index.ts` when sample content was added, so `index.ts` (real
 * configuration: site settings, navigation, service pillars, categories) and
 * `sampleContent.ts` (placeholder content for design review) can share them.
 */
import type { CollectionSlug, GlobalSlug, Payload } from 'payload'

export const LOCALES = ['de', 'ar', 'en'] as const
export type Locale = (typeof LOCALES)[number]

/** A value written once per locale. */
export type L10n<T = string> = Record<Locale, T>

function isLocaleMap(value: unknown): value is Record<Locale, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    LOCALES.every((l) => l in value) &&
    Object.keys(value).length === LOCALES.length
  )
}

/**
 * Payload's local API writes one locale per call — passing a `{de, ar, en}` object straight
 * into `data` silently stores the object itself as the field value instead of populating each
 * locale. This walks a seed literal and extracts just the values for one locale, recursing into
 * nested groups/arrays.
 */
export function pickLocale(data: unknown, locale: Locale): unknown {
  if (Array.isArray(data)) return data.map((item) => pickLocale(item, locale))
  if (data !== null && typeof data === 'object') {
    if (isLocaleMap(data)) return data[locale]
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, pickLocale(value, locale)]),
    )
  }
  return data
}

// Payload's generated types aren't available (no DB connection at typecheck time), so the Local
// API's per-collection `data` typing can't be resolved generically here — this is the one
// intentional escape hatch for that.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const asData = (v: unknown): any => v

/**
 * Builds the payload for a non-default locale, reusing the array-row `id`s Payload generated on
 * the first (German) write — but only for the arrays where that is correct.
 *
 * Two kinds of array look identical after `pickLocale` has flattened them, and they need
 * opposite treatment:
 *
 *   1. The array field itself is `localized: true` (`Navigation.header`). Payload keeps a
 *      separate set of rows per locale, so the German ids are meaningless for Arabic — sending
 *      them fails with `ValidationError: ... id`. In the seed literal this appears as a locale
 *      map whose values are arrays: `header: { de: [...], ar: [...], en: [...] }`.
 *   2. The array is shared and only its *sub-fields* are localized (`Roadmaps.steps[].title`,
 *      `SiteSettings.jobResourceLinks[].label`). Here all locales share one set of rows, and an
 *      item arriving without an `id` is treated as a new row — so Payload deletes the German
 *      rows and inserts fresh ones, silently dropping the German text. It surfaces as a roadmap
 *      card with a title but no steps, because `steps[].title` came back null for the requested
 *      locale and the component filters those out. In the seed literal this is a plain array
 *      whose items contain locale maps.
 *
 * Walking the *original* literal rather than the flattened result is what makes the two
 * distinguishable: case 1 is `isLocaleMap`, case 2 is a bare `Array`.
 */
function localePayload(created: unknown, original: unknown, locale: Locale): unknown {
  // Case 1: whole field is localized — take this locale's value verbatim, no id reuse.
  if (isLocaleMap(original)) return pickLocale(original, locale)

  // Case 2: shared array with localized sub-fields — carry the ids across.
  if (Array.isArray(original)) {
    const createdArr = Array.isArray(created) ? created : []
    return original.map((item, i) => {
      const source = createdArr[i]
      const value = localePayload(source, item, locale)
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        source !== null &&
        typeof source === 'object' &&
        'id' in (source as Record<string, unknown>)
      ) {
        return { ...(value as Record<string, unknown>), id: (source as Record<string, unknown>).id }
      }
      return value
    })
  }

  if (original !== null && typeof original === 'object') {
    const createdObj = (created ?? {}) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(original as Record<string, unknown>).map(([k, v]) => [
        k,
        localePayload(createdObj[k], v, locale),
      ]),
    )
  }

  return original
}

export function makeHelpers(payload: Payload) {
  async function createLocalized(collection: CollectionSlug, data: Record<string, unknown>) {
    const doc = await payload.create({
      collection,
      data: asData(pickLocale(data, 'de')),
      locale: 'de',
      overrideAccess: true,
    })
    if (doc?.id === undefined || doc?.id === null) {
      throw new Error(
        `[seed] ${collection}: create() returned no id, so the other locales cannot be written. ` +
          `A likely cause is a hook wired to the wrong stage — a beforeChange hook (which returns ` +
          `\`data\`) placed in afterChange replaces the saved document with one that has no id. ` +
          `Returned keys: ${Object.keys(doc ?? {}).join(', ') || '(none)'}`,
      )
    }
    for (const locale of LOCALES.filter((l) => l !== 'de')) {
      await payload.update({
        collection,
        id: doc.id,
        data: asData(localePayload(doc, data, locale)),
        locale,
        overrideAccess: true,
      })
    }
    return doc
  }

  async function updateGlobalLocalized(slug: GlobalSlug, data: Record<string, unknown>) {
    const written = await payload.updateGlobal({
      slug,
      data: asData(pickLocale(data, 'de')),
      locale: 'de',
      overrideAccess: true,
    })
    for (const locale of LOCALES.filter((l) => l !== 'de')) {
      await payload.updateGlobal({
        slug,
        data: asData(localePayload(written, data, locale)),
        locale,
        overrideAccess: true,
      })
    }
  }

  /**
   * Creates the document only if `field` doesn't already hold `value`.
   *
   * The original seed had no such guard, so a second run duplicated every service pillar and
   * category. Seeding is the kind of thing that gets re-run — after a DB reset, on a new Neon
   * branch, when someone wants the sample content back — so every write here is keyed on a
   * natural identifier and skipped when it's already present.
   */
  async function upsert(
    collection: CollectionSlug,
    field: string,
    value: string,
    data: Record<string, unknown>,
  ): Promise<{ id: string | number; created: boolean }> {
    const existing = await payload.find({
      collection,
      where: { [field]: { equals: value } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const found = existing.docs[0]
    if (found) return { id: found.id, created: false }
    const doc = await createLocalized(collection, data)
    return { id: doc.id, created: true }
  }

  return { createLocalized, updateGlobalLocalized, upsert }
}

// ─── Rich text ────────────────────────────────────────────────────────────────

type LexicalNode = Record<string, unknown>

function textNode(text: string): LexicalNode {
  return { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }
}

function paragraph(text: string): LexicalNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children: [textNode(text)],
  }
}

function heading(text: string): LexicalNode {
  return {
    type: 'heading',
    tag: 'h2',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [textNode(text)],
  }
}

/**
 * Builds a Payload/Lexical editor state from plain paragraphs. A string starting with `## `
 * becomes an h2. This is the minimal valid shape `convertLexicalToHTML` (used by
 * `src/components/ui/LexicalContent.tsx`) accepts.
 */
export function richText(...blocks: string[]): Record<string, unknown> {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: blocks.map((b) => (b.startsWith('## ') ? heading(b.slice(3)) : paragraph(b))),
    },
  }
}

// ─── Sample-content marking ───────────────────────────────────────────────────

/**
 * Every seeded entry opens with this line.
 *
 * The board must never mistake placeholder text for copy they approved — this project has a
 * standing rule against inventing content (see `DECISIONS.md`, and the refusal to fabricate a
 * "+1,200 members" figure). The notice sits in the body rather than the title so the homepage
 * teasers and listings still look like the Figma, while anyone who opens the entry — in the CMS
 * or on the public detail page — sees immediately that it is scaffolding.
 *
 * Deliberately no invented specifics anywhere in this seed: no fees, deadlines, office
 * addresses, phone numbers or document checklists. Procedural text stays at a level that is
 * true in general, and every roadmap and guide article points at the real official source so a
 * reader who lands on one mid-review is sent somewhere authoritative.
 */
export const SAMPLE_NOTICE: L10n = {
  de: 'BEISPIELINHALT — dieser Text ist ein Platzhalter für die Gestaltungsabnahme und muss vor dem Launch durch echte, vom Vorstand geprüfte Inhalte ersetzt werden.',
  ar: 'محتوى تجريبي — هذا النص عنصر نائب لمراجعة التصميم، ويجب استبداله قبل الإطلاق بمحتوى حقيقي معتمد من مجلس الإدارة.',
  en: 'SAMPLE CONTENT — this text is a placeholder for design review and must be replaced with real, board-approved content before launch.',
}

/** Name marker for records that stand for a person (experts, board members). */
export const SAMPLE_PERSON: L10n = {
  de: '(Beispieleintrag)',
  ar: '(مُدخل تجريبي)',
  en: '(sample entry)',
}
