import { Api, type ApiResponse, type Json } from './api'

export const ROLES = ['admin', 'board', 'editor', 'viewer'] as const
export type Role = (typeof ROLES)[number]
export type Actor = Role | 'anonymous'
export const ACTORS: Actor[] = ['anonymous', 'viewer', 'editor', 'board', 'admin']

export const REVIEW_STATUSES = ['draft', 'in_review', 'published', 'archived'] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

export const PASSWORD = 'qa-Password-123!'
export const userEmail = (role: Role) => `qa-${role}@test.invalid`

/** Private values seeded on experts — tests look for these strings in anonymous responses. */
export const EXPERT_PRIVATE = {
  published: { contactEmail: 'qa-private-published@test.invalid', contactPhone: '+43 1 000 0001' },
  draft: { contactEmail: 'qa-private-draft@test.invalid', contactPhone: '+43 1 000 0002' },
  in_review: { contactEmail: 'qa-private-inreview@test.invalid', contactPhone: '+43 1 000 0003' },
  archived: { contactEmail: 'qa-private-archived@test.invalid', contactPhone: '+43 1 000 0004' },
} satisfies Record<ReviewStatus, { contactEmail: string; contactPhone: string }>

export const SETTINGS_PRIVATE = {
  boardEmail: 'qa-board-settings-private@test.invalid',
  submissionRetentionMonths: 12,
  expertApplicationRetentionMonths: 6,
}

export const REVIEWED_COLLECTIONS = [
  'news',
  'events',
  'services',
  'guide-articles',
  'roadmaps',
  'experts',
  'jobs',
  'pages',
] as const
export type ReviewedCollection = (typeof REVIEWED_COLLECTIONS)[number]

export type Fixtures = {
  baseUrl: string
  tokens: Record<Role, string>
  userIds: Record<Role, string | number>
  firstRegister: { status: number; bodyKeys: string[] }
  pillarId: string | number
  topicId: string | number
  /** docs[collection][status] = id */
  docs: Record<ReviewedCollection, Record<ReviewStatus, string | number>>
  slugs: Record<ReviewedCollection, Record<ReviewStatus, string>>
  mediaId: string | number
  boardMemberId: string | number
  contactSubmissionId: string | number
}

let counter = 0
export const uniq = (p: string) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`

export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** Minimal valid document for each collection (required fields only, see src/collections). */
export function buildDoc(
  collection: string,
  ctx: { pillarId?: string | number; topicId?: string | number },
  status: ReviewStatus = 'draft',
): Record<string, unknown> {
  const slug = uniq(`qa-${collection}-${status}`)
  const title = `QA ${collection} ${status} ${slug}`
  const today = new Date().toISOString()
  switch (collection) {
    case 'news':
    case 'pages':
      return { title, slug, reviewStatus: status }
    case 'events':
      return { title, slug, startDate: new Date(Date.now() + 30 * 864e5).toISOString(), reviewStatus: status }
    case 'services':
      return { title, slug, pillar: ctx.pillarId, reviewStatus: status }
    case 'guide-articles':
      return { title, slug, topic: ctx.topicId, lastReviewedAt: today, reviewIntervalMonths: 12, reviewStatus: status }
    case 'roadmaps':
      return {
        title,
        slug,
        lastReviewedAt: today,
        reviewIntervalMonths: 12,
        steps: [{ title: 'Step 1', description: 'QA step' }],
        reviewStatus: status,
      }
    case 'jobs':
      return {
        title,
        slug,
        organisation: 'QA Org',
        employmentType: 'full_time',
        applyUrl: 'https://example.test/apply',
        expiryDate: new Date(Date.now() + 60 * 864e5).toISOString(),
        reviewStatus: status,
      }
    case 'experts':
      return {
        name: title,
        slug,
        bio: 'QA bio',
        ...EXPERT_PRIVATE[status],
        showEmail: false,
        showPhone: false,
        consentOnFile: true,
        consentDate: today,
        reviewStatus: status,
      }
    case 'board-members':
      return { name: `QA Board ${slug}`, role: 'QA role', order: 1 }
    case 'contact-submissions':
      return { name: 'QA Sender', email: 'qa-sender@test.invalid', message: 'QA message long enough', consentGiven: true }
    case 'categories':
      return { name: `QA cat ${slug}`, slug, type: 'news' }
    default:
      throw new Error(`no builder for ${collection}`)
  }
}

export function mediaForm(alt = 'QA alt'): FormData {
  const form = new FormData()
  form.append('file', new Blob([TINY_PNG], { type: 'image/png' }), `${uniq('qa-test-media')}.png`)
  form.append('_payload', JSON.stringify({ alt }))
  return form
}

/** Creates a doc (or uploads media) as `token`; returns the raw response. */
export async function createAs(
  api: Api,
  collection: string,
  token: string | null,
  ctx: { pillarId?: string | number; topicId?: string | number },
  status: ReviewStatus = 'draft',
): Promise<ApiResponse> {
  if (collection === 'media') return api.request('POST', '/api/media', { token, form: mediaForm() })
  return api.post(`/api/${collection}`, buildDoc(collection, ctx, status), token)
}

function must(res: ApiResponse, what: string): Json {
  if (res.status >= 300 || !res.body?.doc?.id) {
    throw new Error(`[seed] ${what} failed: HTTP ${res.status} ${res.text.slice(0, 800)}`)
  }
  return res.body.doc
}

export async function seed(api: Api): Promise<Fixtures> {
  // ── Users ─────────────────────────────────────────────────────────────────
  // first-register is the only way to create the first user over HTTP on an empty database — that
  // it works anonymously is itself QA_AUDIT S14; the response is recorded as evidence.
  const first = await api.post('/api/users/first-register', {
    email: userEmail('admin'),
    password: PASSWORD,
    name: 'QA Admin',
    role: 'admin',
  })
  if (first.status >= 300) throw new Error(`[seed] first-register failed: ${first.status} ${first.text.slice(0, 500)}`)
  const tokens = {} as Record<Role, string>
  const userIds = {} as Record<Role, string | number>
  tokens.admin = await api.login(userEmail('admin'), PASSWORD)
  const me = await api.get('/api/users/me', tokens.admin)
  if (me.body?.user?.role !== 'admin') throw new Error(`[seed] first user is not admin: ${me.text}`)
  userIds.admin = me.body.user.id
  for (const role of ['board', 'editor', 'viewer'] as const) {
    const doc = must(
      await api.post('/api/users', { email: userEmail(role), password: PASSWORD, name: `QA ${role}`, role }, tokens.admin),
      `create user ${role}`,
    )
    userIds[role] = doc.id
    tokens[role] = await api.login(userEmail(role), PASSWORD)
  }

  // ── Reference data ────────────────────────────────────────────────────────
  const pillar = must(
    await api.post('/api/service-pillars', { title: 'QA Pillar', slug: uniq('qa-pillar'), order: 1 }, tokens.admin),
    'service pillar',
  )
  const topic = must(
    await api.post('/api/guide-topics', { title: 'QA Topic', slug: uniq('qa-topic'), order: 1 }, tokens.admin),
    'guide topic',
  )
  const ctx = { pillarId: pillar.id, topicId: topic.id }

  // ── One document per review status per reviewed collection ────────────────
  const docs = {} as Fixtures['docs']
  const slugs = {} as Fixtures['slugs']
  for (const collection of REVIEWED_COLLECTIONS) {
    docs[collection] = {} as Record<ReviewStatus, string | number>
    slugs[collection] = {} as Record<ReviewStatus, string>
    for (const status of REVIEW_STATUSES) {
      const doc = must(await createAs(api, collection, tokens.admin, ctx, status), `${collection}/${status}`)
      if (doc.reviewStatus !== status) {
        throw new Error(`[seed] ${collection}/${status} saved with reviewStatus=${doc.reviewStatus}`)
      }
      docs[collection][status] = doc.id
      slugs[collection][status] = doc.slug
    }
  }

  const media = must(await createAs(api, 'media', tokens.admin, ctx), 'media upload')
  const boardMember = must(await createAs(api, 'board-members', tokens.admin, ctx), 'board member')
  const submission = must(await createAs(api, 'contact-submissions', tokens.admin, ctx), 'contact submission')

  // ── SiteSettings with the private fields S4 looks for ─────────────────────
  const settings = await api.post(
    '/api/globals/site-settings',
    {
      orgName: 'QA Org',
      boardNotificationEmails: [{ email: SETTINGS_PRIVATE.boardEmail }],
      submissionRetentionMonths: SETTINGS_PRIVATE.submissionRetentionMonths,
      expertApplicationRetentionMonths: SETTINGS_PRIVATE.expertApplicationRetentionMonths,
    },
    tokens.admin,
  )
  if (settings.status >= 300) throw new Error(`[seed] site-settings failed: ${settings.status} ${settings.text.slice(0, 800)}`)

  return {
    baseUrl: api.baseUrl,
    tokens,
    userIds,
    firstRegister: { status: first.status, bodyKeys: Object.keys(first.body ?? {}) },
    pillarId: pillar.id,
    topicId: topic.id,
    docs,
    slugs,
    mediaId: media.id,
    boardMemberId: boardMember.id,
    contactSubmissionId: submission.id,
  }
}
