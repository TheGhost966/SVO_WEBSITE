import type { Access, CollectionBeforeChangeHook, CollectionBeforeOperationHook, CollectionConfig } from 'payload'

/** The roles that work on unpublished content. */
const EDITOR_PLUS = ['admin', 'board', 'editor']

// ─── Collection-level access ──────────────────────────────────────────────────

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const isAdminOrBoard: Access = ({ req }) =>
  ['admin', 'board'].includes(req.user?.role ?? '')

export const isEditorOrAbove: Access = ({ req }) => EDITOR_PLUS.includes(req.user?.role ?? '')

export const isLoggedIn: Access = ({ req }) => !!req.user

/**
 * Published content for everyone; unpublished (draft / in_review / archived) only for the roles that
 * work on it — editor, board, admin. `viewer` is read-only and sees what the public sees (QA S6);
 * logging in alone no longer unlocks drafts.
 */
export const readPublishedOrEditorPlus: Access = ({ req }) => {
  if (EDITOR_PLUS.includes(req.user?.role ?? '')) return true
  return { reviewStatus: { equals: 'published' } }
}

/**
 * Below editor, a read is always answered from the live row: `draft=true` is ignored (QA C1).
 *
 * With `draft: true` Payload does not read the collection table. `find` queries the versions table
 * (`latest = true`) and applies the read rule above to the *version*; `findByID` and relationship
 * population swap the live row for a newer draft version. So `reviewStatus = published` then means
 * "the newest version calls itself published", not "this is what is live" — and anonymous callers
 * were served a draft saved over a live document, a version marked published whose live row is not,
 * and the versions (`id: null`) of rows deleted directly in the database.
 *
 * Nobody below editor has any business in the versions table, so the flag is dropped before the
 * operation runs, rather than trying to make every version-side query safe. Local API calls that
 * override access (the public site's own queries, hooks) are left alone.
 */
export const liveRowOnlyBelowEditor: CollectionBeforeOperationHook = ({ args, operation, overrideAccess, req }) => {
  if (operation !== 'read' || overrideAccess) return args
  if (EDITOR_PLUS.includes(req.user?.role ?? '')) return args
  if ((args as { draft?: boolean }).draft) return { ...args, draft: false }
  return args
}

/**
 * Applied to every collection in payload.config.ts: a collection with drafts gets
 * {@link liveRowOnlyBelowEditor}, so one added later cannot be forgotten.
 */
export function withLiveRowReads(collection: CollectionConfig): CollectionConfig {
  const hasDrafts = typeof collection.versions === 'object' && Boolean(collection.versions.drafts)
  if (!hasDrafts) return collection
  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeOperation: [liveRowOnlyBelowEditor, ...(collection.hooks?.beforeOperation ?? [])],
    },
  }
}

/**
 * A save always writes the document row: `draft=true` is ignored on create and update (QA A1).
 *
 * With `draft: true` Payload stores a version and leaves the row alone. The row is what the public
 * site reads, and `reviewStatus` — not Payload's draft flag — is what decides whether a document is
 * live. So a draft save produced three wrong results in the admin panel: an edit to a published
 * document was reported as saved and the form reloaded with the old text; a document set to
 * Archived stayed online; an editor's "in review" existed only in a version. With the flag dropped
 * there is one kind of save, the row is the truth and the versions are its history. Two things go
 * with it: changes cannot be parked on a live document, and a draft has to pass the required-field
 * validation like any other save.
 */
export const saveToLiveRow: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== 'create' && operation !== 'update') return args
  if ((args as { draft?: boolean }).draft) return { ...args, draft: false }
  return args
}

const NOTHING = '@/components/admin/SingleSave#Nothing'

/**
 * Applied to every collection in payload.config.ts: a collection with drafts gets
 * {@link saveToLiveRow} and one "Save" button in place of Payload's "Save Draft" / "Publish
 * changes" pair. Payload's own status line ("Status: Published — Unpublish") is hidden as well: it
 * follows the button that was pressed, and the Status field is the one that counts.
 */
export function withSingleSave(collection: CollectionConfig): CollectionConfig {
  const hasDrafts = typeof collection.versions === 'object' && Boolean(collection.versions.drafts)
  if (!hasDrafts) return collection
  return {
    ...collection,
    admin: {
      ...collection.admin,
      components: {
        ...collection.admin?.components,
        edit: {
          ...collection.admin?.components?.edit,
          SaveDraftButton: NOTHING,
          PublishButton: '@payloadcms/ui#SaveButton',
          Status: NOTHING,
        },
      },
    },
    hooks: {
      ...collection.hooks,
      beforeOperation: [saveToLiveRow, ...(collection.hooks?.beforeOperation ?? [])],
    },
  }
}

/**
 * Update rule for collections with the review workflow (QA S7). Board/admin may change anything.
 * Editors work on drafts only — documented workflow: draft → in_review → board/admin publishes — so
 * a `published` or `archived` document is not updatable by an editor at all: no content edits that
 * would go live unreviewed, no taking live content offline via in_review, no reviving archived
 * content. Enforced as access (a Where constraint), so it covers by-id and bulk updates, draft saves
 * and version restores alike; enforceReviewStatusAccess still stops editors publishing their drafts.
 */
export const updateUnpublishedOrBoardPlus: Access = ({ req }) => {
  const role = req.user?.role
  if (role === 'admin' || role === 'board') return true
  if (role === 'editor') return { reviewStatus: { not_in: ['published', 'archived'] } }
  return false
}

/**
 * Admins: every account. Everyone else: only their own. Anonymous: nothing.
 *
 * "Own account" is a Where constraint rather than a comparison with the `id` argument, because list
 * and bulk requests have no `id`: the previous `req.user?.id === id` was `undefined === undefined`
 * for an anonymous list or bulk call, which let anyone read every account and bulk-update them —
 * passwords included (QA S21, qa/security/s21-users-access.test.ts).
 */
export const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return { id: { equals: req.user.id } }
}

// ─── Workflow hooks ───────────────────────────────────────────────────────────

/** Keeps Payload's native _status in sync with our reviewStatus field */
export const syncPublishStatus: CollectionBeforeChangeHook = ({ data }) => ({
  ...data,
  _status: data.reviewStatus === 'published' ? 'published' : 'draft',
})

/**
 * Prevents editors from escalating reviewStatus to 'published' or 'archived'.
 * Access control for individual field values isn't possible in Payload — this hook enforces it.
 */
export const enforceReviewStatusAccess: CollectionBeforeChangeHook = ({
  data,
  req,
  originalDoc,
}) => {
  const role = req.user?.role ?? 'viewer'
  if (role === 'editor' && ['published', 'archived'].includes(data.reviewStatus ?? '')) {
    data.reviewStatus = originalDoc?.reviewStatus ?? 'draft'
  }
  return data
}
