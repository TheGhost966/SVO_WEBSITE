import type { Access, CollectionBeforeChangeHook } from 'payload'

// ─── Collection-level access ──────────────────────────────────────────────────

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const isAdminOrBoard: Access = ({ req }) =>
  ['admin', 'board'].includes(req.user?.role ?? '')

export const isEditorOrAbove: Access = ({ req }) =>
  ['admin', 'board', 'editor'].includes(req.user?.role ?? '')

export const isLoggedIn: Access = ({ req }) => !!req.user

/**
 * Published content for everyone; unpublished (draft / in_review / archived) only for the roles that
 * work on it — editor, board, admin. `viewer` is read-only and sees what the public sees (QA S6);
 * logging in alone no longer unlocks drafts.
 */
export const readPublishedOrEditorPlus: Access = ({ req }) => {
  if (['admin', 'board', 'editor'].includes(req.user?.role ?? '')) return true
  return { reviewStatus: { equals: 'published' } }
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
