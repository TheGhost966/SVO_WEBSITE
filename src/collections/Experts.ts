import type { CollectionBeforeChangeHook, CollectionConfig, FieldAccess } from 'payload'
import {
  isEditorOrAbove,
  readPublishedOrEditorPlus,
  updateUnpublishedOrBoardPlus,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'
import { bundeslandField } from '@/fields/bundeslandField'
import { validateExternalUrl } from '@/lib/safeUrl'

// Field-level access must return a plain boolean (unlike collection-level
// Access, which may also return a Where query for row filtering).
const boardOrAdminOnly: FieldAccess = ({ req }) => ['admin', 'board'].includes(req.user?.role ?? '')

// Private applicant data must never reach anonymous REST/GraphQL callers just because the listing is
// published (QA S1). Field-level `read` access also makes Payload refuse `where`/`sort` on these
// paths for callers who can't read them, so they can't be used as a search oracle either. The public
// site reads through the Local API (overrideAccess), so its own showEmail/showPhone rendering is
// unaffected.
const editorOrAbove: FieldAccess = ({ req }) => ['admin', 'board', 'editor'].includes(req.user?.role ?? '')
const readableIfShown =
  (flag: 'showEmail' | 'showPhone'): FieldAccess =>
  (args) =>
    editorOrAbove(args) || (args.siblingData ?? args.doc)?.[flag] === true

// BRIEF-AMENDMENT-03 §2.5: professional proof is now "مطلوب إلزامي" (mandatory) per the client
// questionnaire. A hard block would stop the board from publishing while verification is still
// in progress (an editorial/process step, not a system-enforced gate — see DECISIONS.md "Experts
// slice" § "Verification ownership"), so this only warns, loudly, in the server log — it never
// throws and never blocks the save. Fires only on the transition into `published`, not on every
// re-save of an already-published-and-still-unverified listing.
const warnIfPublishingUnverified: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const willBePublished = data.reviewStatus === 'published'
  const wasAlreadyPublished = originalDoc?.reviewStatus === 'published'
  if (willBePublished && !wasAlreadyPublished && data.verificationStatus !== 'verified') {
    req.payload.logger.warn(
      `Experts: publishing "${data.name}" with verificationStatus="${data.verificationStatus ?? 'unverified'}" — ` +
        'confirm this person is actually registered with the relevant chamber/authority before publishing ' +
        '(BRIEF-AMENDMENT-03 §2.5). This is a warning, not a block — the save will proceed.',
    )
  }
  return data
}

// SECURITY (BRIEF-AMENDMENT-01 §2.1): this collection is publicly readable
// (published records only) but access.create stays isEditorOrAbove — never
// () => true. The public "apply to be listed" flow goes through
// src/lib/expertApplicationAction.ts, which uses the Local API with
// overrideAccess: true and an explicit field whitelist. That is the ONLY
// sanctioned public write path; do not open POST /api/experts.
//
// name/slug are intentionally NOT localized — a person's name and their
// listing URL don't change per language (only `bio` does), which also
// sidesteps the untranslated-locale-slug-404 issue documented for
// Guide/Roadmaps/Services in DECISIONS.md.
export const Experts: CollectionConfig = {
  slug: 'experts',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'name',
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    defaultColumns: ['name', 'verificationStatus', 'reviewStatus', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: { de: 'Name', ar: 'الاسم', en: 'Name' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: { de: 'Slug (URL)', ar: 'الرابط', en: 'Slug (URL)' },
      admin: {
        description: 'Generated from the name on application. Editable, but must stay unique.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: { de: 'Fachbereiche', ar: 'مجالات الخبرة', en: 'Fields of expertise' },
      filterOptions: { type: { equals: 'expert' } },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: { de: 'Über', ar: 'نبذة', en: 'Bio' },
    },
    {
      // Added so the situation quiz can point people at experts in their own state, and so the
      // experts index can filter by region — the Figma shows a region dropdown there, which
      // DECISIONS.md had recorded as unbuildable while only free-text `city` existed.
      ...bundeslandField,
    },
    {
      name: 'city',
      type: 'text',
      label: { de: 'Ort', ar: 'المدينة', en: 'City' },
    },
    {
      name: 'languages',
      type: 'array',
      label: { de: 'Sprachen', ar: 'اللغات', en: 'Languages' },
      labels: {
        singular: { de: 'Sprache', ar: 'لغة', en: 'Language' },
        plural: { de: 'Sprachen', ar: 'اللغات', en: 'Languages' },
      },
      fields: [{ name: 'language', type: 'text', required: true, label: { de: 'Sprache', ar: 'اللغة', en: 'Language' } }],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'contactEmail',
          type: 'email',
          access: { read: readableIfShown('showEmail') },
          label: { de: 'Kontakt-E-Mail', ar: 'البريد الإلكتروني', en: 'Contact email' },
          admin: { width: '70%' },
        },
        // BRIEF-AMENDMENT-03 §2.5: questionnaire §7.4 (show email/website publicly) and §7.6
        // (contact only via an admin-mediated request) directly contradict each other — logged
        // for the board in DECISIONS.md. Both toggles default OFF (admin-mediated by default,
        // per §7.6) until the board picks a site-wide policy; a board/admin can still opt a
        // specific listing into direct display per §7.4 on a case-by-case basis.
        {
          name: 'showEmail',
          type: 'checkbox',
          defaultValue: false,
          label: { de: 'E-Mail öffentlich anzeigen', ar: 'إظهار البريد الإلكتروني علنًا', en: 'Show email publicly' },
          admin: { width: '30%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'contactPhone',
          type: 'text',
          access: { read: readableIfShown('showPhone') },
          label: { de: 'Telefon', ar: 'الهاتف', en: 'Phone' },
          admin: { width: '70%' },
        },
        {
          name: 'showPhone',
          type: 'checkbox',
          defaultValue: false,
          label: { de: 'Telefon öffentlich anzeigen', ar: 'إظهار الهاتف علنًا', en: 'Show phone publicly' },
          admin: { width: '30%' },
        },
      ],
    },
    {
      name: 'website',
      type: 'text',
      label: { de: 'Website', ar: 'الموقع الإلكتروني', en: 'Website' },
      // QA S16: this value arrives from the public application form and is rendered as a link.
      // Only absolute http(s) / mailto URLs are storable; the page checks again when it renders.
      validate: (value: unknown, { req }: { req?: { i18n?: { language?: string } } }) => validateExternalUrl(value, req?.i18n?.language),
    },
    // No photo field on the public application — the board attaches one
    // after verification, via the admin panel only (§2.1).
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: { de: 'Foto', ar: 'الصورة', en: 'Photo' },
      admin: { description: 'Added by the board after verification — not part of the public application form.' },
    },
    // ── Third-party personal data (BRIEF-AMENDMENT-01 §2.7) ─────────────────
    {
      name: 'consentOnFile',
      type: 'checkbox',
      access: { read: editorOrAbove },
      defaultValue: false,
      label: { de: 'Einwilligung liegt vor', ar: 'الموافقة متوفرة', en: 'Consent on file' },
      admin: {
        description: 'Set automatically by the public application form when the applicant checks the consent box.',
      },
    },
    {
      name: 'consentDate',
      type: 'date',
      access: { read: editorOrAbove },
      label: { de: 'Einwilligung vom', ar: 'تاريخ الموافقة', en: 'Consent date' },
    },
    {
      name: 'verificationStatus',
      type: 'select',
      defaultValue: 'unverified',
      label: { de: 'Verifizierungsstatus', ar: 'حالة التحقق', en: 'Verification status' },
      options: [
        { label: { de: 'Nicht verifiziert', ar: 'غير موثّق', en: 'Unverified' }, value: 'unverified' },
        { label: { de: 'Verifiziert', ar: 'موثّق', en: 'Verified' }, value: 'verified' },
      ],
      // Field-level access, not just update-time — §2.1: "update access does
      // not gate the value on insert." Only admin/board may ever set this,
      // on create AND update; a plain editor role cannot self-verify.
      access: { read: editorOrAbove, create: boardOrAdminOnly, update: boardOrAdminOnly },
      admin: {
        description: 'Confirm the person is actually registered with the relevant chamber/authority before verifying.',
      },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      label: { de: 'Verifiziert am', ar: 'تاريخ التحقق', en: 'Verified at' },
      access: { read: editorOrAbove, create: boardOrAdminOnly, update: boardOrAdminOnly },
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: { de: 'Status', ar: 'الحالة', en: 'Status' },
      options: [
        { label: { de: 'Entwurf', ar: 'مسودة', en: 'Draft' }, value: 'draft' },
        { label: { de: 'Zur Überprüfung eingereicht', ar: 'قيد المراجعة', en: 'In review' }, value: 'in_review' },
        { label: { de: 'Veröffentlicht', ar: 'منشور', en: 'Published' }, value: 'published' },
        { label: { de: 'Archiviert', ar: 'مؤرشف', en: 'Archived' }, value: 'archived' },
      ],
      admin: {
        description: {
          de: 'Redakteure können nur auf "Zur Überprüfung" setzen. Nur Vorstand/Admin kann veröffentlichen.',
        },
      },
    },
  ],
  hooks: {
    beforeChange: [enforceReviewStatusAccess, syncPublishStatus, notifyBoardOnReview, warnIfPublishingUnverified],
    afterChange: [makeRevalidateOnPublish('experts')],
    afterDelete: [makeRevalidateOnDelete('experts')],
  },
  access: {
    read: readPublishedOrEditorPlus,
    // Version history holds every draft — same audience as unpublished content (QA S6).
    readVersions: isEditorOrAbove,
    // Never () => true — the public write path is the Local API server
    // action (expertApplicationAction.ts) with overrideAccess: true, not
    // this REST/GraphQL create endpoint.
    create: isEditorOrAbove,
    // Editors may not touch published/archived documents (QA S7).
    update: updateUnpublishedOrBoardPlus,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
