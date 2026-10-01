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

/** Admin can do anything to other users; users can update themselves */
export const isAdminOrSelf: Access = ({ req, id }) => {
  if (req.user?.role === 'admin') return true
  if (req.user?.id === id) return true
  return false
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
