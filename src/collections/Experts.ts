import type { CollectionConfig, FieldAccess } from 'payload'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish } from '@/hooks/revalidateOnPublish'

// Field-level access must return a plain boolean (unlike collection-level
// Access, which may also return a Where query for row filtering).
const boardOrAdminOnly: FieldAccess = ({ req }) => ['admin', 'board'].includes(req.user?.role ?? '')

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
      name: 'contactEmail',
      type: 'email',
      label: { de: 'Kontakt-E-Mail', ar: 'البريد الإلكتروني', en: 'Contact email' },
    },
    {
      name: 'contactPhone',
      type: 'text',
      label: { de: 'Telefon', ar: 'الهاتف', en: 'Phone' },
    },
    {
      name: 'website',
      type: 'text',
      label: { de: 'Website', ar: 'الموقع الإلكتروني', en: 'Website' },
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
      defaultValue: false,
      label: { de: 'Einwilligung liegt vor', ar: 'الموافقة متوفرة', en: 'Consent on file' },
      admin: {
        description: 'Set automatically by the public application form when the applicant checks the consent box.',
      },
    },
    {
      name: 'consentDate',
      type: 'date',
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
      access: { create: boardOrAdminOnly, update: boardOrAdminOnly },
      admin: {
        description: 'Confirm the person is actually registered with the relevant chamber/authority before verifying.',
      },
    },
    {
      name: 'verifiedAt',
      type: 'date',
      label: { de: 'Verifiziert am', ar: 'تاريخ التحقق', en: 'Verified at' },
      access: { create: boardOrAdminOnly, update: boardOrAdminOnly },
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
    beforeChange: [enforceReviewStatusAccess, syncPublishStatus, notifyBoardOnReview],
    afterChange: [makeRevalidateOnPublish('experts')],
  },
  access: {
    read: readPublishedOrLoggedIn,
    // Never () => true — the public write path is the Local API server
    // action (expertApplicationAction.ts) with overrideAccess: true, not
    // this REST/GraphQL create endpoint.
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
