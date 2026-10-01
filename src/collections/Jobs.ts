import type { CollectionConfig, Field } from 'payload'
import { seoGroup } from '@/fields/seoGroup'
import { bundeslandField } from '@/fields/bundeslandField'
import {
  isEditorOrAbove,
  readPublishedOrLoggedIn,
  syncPublishStatus,
  enforceReviewStatusAccess,
} from '@/lib/access'
import { notifyBoardOnReview } from '@/hooks/notifyBoardOnReview'
import { makeRevalidateOnPublish, makeRevalidateOnDelete } from '@/hooks/revalidateOnPublish'

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'apprenticeship',
  'internship',
  'volunteer',
] as const

/**
 * Real job postings (Figma 6.png), replacing the curated-links-only scope the Jobs slice
 * originally shipped with.
 *
 * On maintenance: this was previously scoped down to a link list precisely because no board
 * member was named to keep postings current (see DECISIONS.md "Jobs slice"). That risk is real
 * and is answered here structurally rather than by trusting anyone to remember — `expiryDate` is
 * required, `getJobs`/`getJobBySlug` in src/lib/queries.ts filter on it, and both job routes set
 * `revalidate = 300` so the prerendered pages re-render and drop it. A posting therefore stops
 * being public within five minutes of expiring, whether or not anyone tidies up. The curated links
 * in SiteSettings stay on /jobs underneath the postings, so the page is still useful when there
 * are no live postings at all.
 */
export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: {
    singular: { de: 'Stellenangebot', ar: 'عرض عمل', en: 'Job posting' },
    plural: { de: 'Stellenangebote', ar: 'عروض العمل', en: 'Job postings' },
  },
  // Same as every other reviewable content collection: `syncPublishStatus` writes `_status`, and
  // the draft → in_review → published workflow this collection advertises is built on it.
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    group: { de: 'Inhalte', ar: 'المحتوى', en: 'Content' },
    useAsTitle: 'title',
    defaultColumns: ['title', 'organisation', 'reviewStatus', 'expiryDate'],
    preview: (doc) =>
      `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'}/de/stellenangebote/${doc.slug}`,
  },
  access: {
    read: readPublishedOrLoggedIn,
    create: isEditorOrAbove,
    update: isEditorOrAbove,
    delete: isEditorOrAbove,
  },
  hooks: {
    // Order and placement match News/Events deliberately. `notifyBoardOnReview` is a
    // CollectionBeforeChangeHook and returns `data`; putting it in `afterChange` makes that
    // return value replace the saved document, which then has no `id` — Payload reports that
    // downstream as a misleading "Missing 'where' query of documents to update".
    // `enforceReviewStatusAccess` runs before `syncPublishStatus` so `_status` is derived from
    // the reviewStatus that survived the access check, not the one the client asked for.
    beforeChange: [enforceReviewStatusAccess, syncPublishStatus, notifyBoardOnReview],
    afterChange: [makeRevalidateOnPublish('jobs')],
    afterDelete: [makeRevalidateOnDelete('jobs')],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      label: { de: 'Titel', ar: 'العنوان', en: 'Title' },
    },
    {
      // Unlocalized, like events and news — one slug per posting across all three locales
      // (see the `unlocalize_events_news_slugs` migration for why).
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: { de: 'URL-Kürzel', ar: 'الرابط المختصر', en: 'Slug' },
      admin: { description: 'z. B. "kuechenhilfe-wien" — erscheint in der Adresse der Seite.' },
    },
    {
      name: 'organisation',
      type: 'text',
      required: true,
      label: { de: 'Arbeitgeber', ar: 'جهة العمل', en: 'Employer' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          label: { de: 'Ort', ar: 'المدينة', en: 'City' },
          admin: { width: '50%' },
        },
        // Cast because spreading widens the shared field out of Payload's discriminated
        // Field union — the runtime shape is unchanged, only `admin.width` is added.
        { ...bundeslandField, admin: { width: '50%' } } as Field,
      ],
    },
    {
      name: 'employmentType',
      type: 'select',
      required: true,
      defaultValue: 'full_time',
      label: { de: 'Anstellungsart', ar: 'نوع العمل', en: 'Employment type' },
      options: [
        { value: 'full_time', label: { de: 'Vollzeit', ar: 'دوام كامل', en: 'Full time' } },
        { value: 'part_time', label: { de: 'Teilzeit', ar: 'دوام جزئي', en: 'Part time' } },
        { value: 'apprenticeship', label: { de: 'Lehrstelle', ar: 'تدريب مهني', en: 'Apprenticeship' } },
        { value: 'internship', label: { de: 'Praktikum', ar: 'تدريب', en: 'Internship' } },
        { value: 'volunteer', label: { de: 'Ehrenamt', ar: 'عمل تطوعي', en: 'Volunteering' } },
      ],
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: { de: 'Beschreibung', ar: 'الوصف', en: 'Description' },
    },
    {
      name: 'applyUrl',
      type: 'text',
      required: true,
      label: { de: 'Link zur Bewerbung', ar: 'رابط التقديم', en: 'Application link' },
      admin: {
        description: {
          de: 'Vollständige Adresse (https://…) oder mailto:-Link der Stelle, auf die sich Menschen bewerben.',
          ar: 'العنوان الكامل (https://…) أو رابط mailto للجهة التي يتقدم إليها الناس.',
          en: 'Full address (https://…) or a mailto: link people apply through.',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'publishedAt',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          label: { de: 'Veröffentlicht am', ar: 'تاريخ النشر', en: 'Published on' },
          admin: { width: '50%' },
        },
        {
          // Required, and actually enforced by the public queries — an unenforced expiry column
          // is just a note nobody reads (BRIEF-AMENDMENT-01 §2.5).
          name: 'expiryDate',
          type: 'date',
          required: true,
          label: { de: 'Läuft ab am', ar: 'ينتهي في', en: 'Expires on' },
          admin: {
            width: '50%',
            description: {
              de: 'Nach diesem Datum verschwindet die Stelle automatisch von der Website — auch ohne weiteres Zutun.',
              ar: 'بعد هذا التاريخ يختفي العرض تلقائياً من الموقع دون أي إجراء إضافي.',
              en: 'After this date the posting disappears from the website automatically, with nothing further to do.',
            },
          },
        },
      ],
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
    seoGroup,
  ],
}
