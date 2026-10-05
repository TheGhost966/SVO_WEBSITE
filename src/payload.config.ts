import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import { de } from '@payloadcms/translations/languages/de'
import { ar } from '@payloadcms/translations/languages/ar'
import nodemailer from 'nodemailer'
import sharp from 'sharp'

import { resolvePayloadSecret } from '@/lib/payloadSecret'
import { withLiveRowReads, withSingleSave } from '@/lib/access'
import { inAdminOrder, withAdminLayout, withSiteSettingsLayout } from '@/lib/adminLayout'
import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { News } from '@/collections/News'
import { Events } from '@/collections/Events'
import { Services } from '@/collections/Services'
import { ServicePillars } from '@/collections/ServicePillars'
import { GuideTopics } from '@/collections/GuideTopics'
import { GuideArticles } from '@/collections/GuideArticles'
import { Roadmaps } from '@/collections/Roadmaps'
import { Experts } from '@/collections/Experts'
import { Jobs } from '@/collections/Jobs'
import { BoardMembers } from '@/collections/BoardMembers'
import { Partners } from '@/collections/Partners'
import { Pages } from '@/collections/Pages'
import { ContactSubmissions } from '@/collections/ContactSubmissions'

import { SiteSettings } from '@/globals/SiteSettings'
import { Navigation } from '@/globals/Navigation'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ─── Server ────────────────────────────────────────────────────────────────
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000',
  // Throws in production when PAYLOAD_SECRET is missing/weak/a placeholder; dev-only fallback
  // otherwise (src/lib/payloadSecret.ts, QA S3).
  secret: resolvePayloadSecret(),

  // Required for Media's imageSizes (thumbnail/card/hero) to actually generate —
  // just having `sharp` installed isn't enough, Payload needs the reference.
  sharp,

  // ─── Database ──────────────────────────────────────────────────────────────
  db: postgresAdapter({
    // Dev-mode auto-push is off — a real migration path exists now (see
    // src/instrumentation.ts). Auto-push can silently prompt
    // for destructive changes (interactively, which hangs a backgrounded/non-TTY server) and
    // apply them without the review a committed migration file gets. Schema changes now go
    // through PAYLOAD_MIGRATE_CREATE_NAME / PAYLOAD_MIGRATE_ON_BOOT exclusively.
    push: false,
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
      // Connection pooling — handles high traffic
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    },
  }),

  // ─── Editor ────────────────────────────────────────────────────────────────
  editor: lexicalEditor(),

  // ─── Email ─────────────────────────────────────────────────────────────────
  email: nodemailerAdapter({
    defaultFromAddress: process.env.EMAIL_FROM ?? 'noreply@svoe.at',
    defaultFromName: 'SVÖ Website',
    transport: nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_PORT === '465',
      auth:
        process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    }),
  }),

  // ─── Localisation ──────────────────────────────────────────────────────────
  localization: {
    locales: [
      { label: 'Deutsch', code: 'de' },
      { label: 'العربية', code: 'ar', rtl: true },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'de',
    fallback: true, // missing ar/en falls back to de — never shows empty content
  },

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '— SVÖ Admin',
      // The same mark the public site uses (src/app/icon.svg) until the logo file exists.
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/icon.svg' }],
    },
    // With the time: several versions of a document saved on one day are otherwise
    // indistinguishable in the version list.
    dateFormat: 'dd.MM.yyyy HH:mm',
    components: {
      // SVÖ wordmark on the login screen and at the top of the sidebar.
      graphics: {
        Logo: '@/components/admin/Brand#Logo',
        Icon: '@/components/admin/Brand#Icon',
      },
      // Onboarding panel above the collection cards on /admin. The board are volunteers rather
      // than CMS users, and the default dashboard is a bare grid of fifteen cards that says
      // nothing about what the site still needs — this names the empty collections, maps each
      // content type to the public page it fills, and spells out the review workflow.
      // Path string, not an import: Payload resolves it through the importMap
      // (src/app/(payload)/admin/importMap.js — edited by hand, the CLI generator crashes here).
      beforeDashboard: ['@/components/admin/DashboardGuide#DashboardGuide'],
    },
  },

  // ─── Admin UI language (dashboard chrome, not content) ────────────────────
  i18n: {
    supportedLanguages: { en, de, ar },
    fallbackLanguage: 'de',
    // Payload shows "Restore" on every version, also to an editor looking at a published or
    // archived document, which an editor may not change (QA S7). The restore is refused; Payload's
    // own message for that is a bare "there was a problem", so it says who can do it instead.
    translations: {
      de: {
        version: {
          problemRestoringVersion:
            'Diese Version konnte nicht wiederhergestellt werden. Veröffentlichte und archivierte Inhalte kann nur der Vorstand oder ein:e Administrator:in wiederherstellen.',
        },
      },
      en: {
        version: {
          problemRestoringVersion:
            'This version could not be restored. Published and archived content can only be restored by the board or an administrator.',
        },
      },
      ar: {
        version: {
          problemRestoringVersion: 'تعذّرت استعادة هذه النسخة. لا يمكن استعادة المحتوى المنشور أو المؤرشف إلا من قبل مجلس الإدارة أو المدير.',
        },
      },
    },
  },

  // ─── Collections ───────────────────────────────────────────────────────────
  // ─── Media storage ─────────────────────────────────────────────────────────
  // Vercel's filesystem is read-only, so uploads go to Vercel Blob there. Enabled only when
  // BLOB_READ_WRITE_TOKEN is set — without it (local dev, self-hosted) Media keeps writing to
  // public/media via its staticDir. `clientUploads` sends files browser→Blob directly, which
  // sidesteps Vercel's 4.5 MB serverless request-body limit for larger photos/PDFs.
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
      clientUploads: true,
    }),
  ],

  // `withLiveRowReads`: in every collection with drafts, callers below editor read the live row
  // even with `?draft=true` (QA C1, src/lib/access.ts). `withSingleSave`: the same collections
  // get one Save button, and every save writes the document row (QA A1). `withAdminLayout`:
  // German labels and help texts, sidebar groups, list columns and tabs (src/lib/adminLayout.ts);
  // `inAdminOrder` sorts the sidebar by how often a collection is used.
  collections: inAdminOrder([
    Users,
    Media,
    Categories,
    News,
    Events,
    Services,
    ServicePillars,
    GuideTopics,
    GuideArticles,
    Roadmaps,
    Experts,
    Jobs,
    BoardMembers,
    Partners,
    Pages,
    ContactSubmissions,
  ]
    .map(withLiveRowReads)
    .map(withSingleSave)
    .map(withAdminLayout)),

  // ─── Globals ───────────────────────────────────────────────────────────────
  globals: [withSiteSettingsLayout(SiteSettings), Navigation],

  // ─── TypeScript output ─────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ─── GraphQL ───────────────────────────────────────────────────────────────
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
})
