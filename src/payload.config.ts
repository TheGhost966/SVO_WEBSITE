import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { en } from '@payloadcms/translations/languages/en'
import { de } from '@payloadcms/translations/languages/de'
import { ar } from '@payloadcms/translations/languages/ar'
import nodemailer from 'nodemailer'

import { Users } from '@/collections/Users'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { News } from '@/collections/News'
import { Events } from '@/collections/Events'
import { Services } from '@/collections/Services'
import { ServicePillars } from '@/collections/ServicePillars'
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
  secret: process.env.PAYLOAD_SECRET ?? 'INSECURE_DEV_SECRET_REPLACE_ME',

  // ─── Database ──────────────────────────────────────────────────────────────
  db: postgresAdapter({
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
      { label: 'العربية', code: 'ar' },
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
    },
    dateFormat: 'dd.MM.yyyy',
  },

  // ─── Admin UI language (dashboard chrome, not content) ────────────────────
  i18n: {
    supportedLanguages: { en, de, ar },
    fallbackLanguage: 'de',
  },

  // ─── Collections ───────────────────────────────────────────────────────────
  collections: [
    Users,
    Media,
    Categories,
    News,
    Events,
    Services,
    ServicePillars,
    BoardMembers,
    Partners,
    Pages,
    ContactSubmissions,
  ],

  // ─── Globals ───────────────────────────────────────────────────────────────
  globals: [SiteSettings, Navigation],

  // ─── TypeScript output ─────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ─── GraphQL ───────────────────────────────────────────────────────────────
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
})
