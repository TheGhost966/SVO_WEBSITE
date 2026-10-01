/**
 * S4 — SiteSettings must not expose internal fields to the public.
 *
 * Fix (src/globals/SiteSettings.ts): field-level `read` = admin/board on boardNotificationEmails,
 * submissionRetentionMonths and expertApplicationRetentionMonths. The rest of the global stays
 * publicly readable. The site and notifyBoardOnReview read via the Local API (overrideAccess).
 *
 * History: the "REPRODUCES S4" tests (QA_FINDINGS_P0.md) are inverted below on the same requests.
 */
import { describe, expect, inject, it } from 'vitest'
import { Api } from '../harness/api'
import { SETTINGS_PRIVATE } from '../harness/seed'
import { writeEvidence } from '../harness/evidence'
import { waitForMail } from '../harness/smtpSink'

const fx = inject('fixtures')
const api = new Api(fx.baseUrl)

const PRIVATE_SETTINGS_FIELDS = ['boardNotificationEmails', 'submissionRetentionMonths', 'expertApplicationRetentionMonths']
/** Top-level keys the anonymous response carried before the fix, minus the private ones (QA_FINDINGS_P0 S4). */
const PUBLIC_SETTINGS_FIELDS = ['id', 'logo', 'logoAlt', 'orgName', 'tagline', 'contactGroup', 'socialLinks', 'seoGroup', 'jobResourceLinks', 'homeGroup', 'updatedAt', 'createdAt', 'globalType']

const get = (token?: string | null, locale = 'de') => api.get(`/api/globals/site-settings?depth=0&locale=${locale}`, token)

describe('S4 — anonymous GET /api/globals/site-settings', () => {
  it('REGRESSION S4: does NOT contain boardNotificationEmails (field absent, address nowhere in the body)', async () => {
    const res = await get()
    writeEvidence('s4-site-settings-anonymous', { status: res.status, topLevelKeys: Object.keys(res.body ?? {}), body: res.body })
    expect(res.status).toBe(200)
    expect(res.body).not.toHaveProperty('boardNotificationEmails')
    expect(res.text).not.toContain(SETTINGS_PRIVATE.boardEmail)
  })

  it('REGRESSION S4: does NOT contain the retention settings', async () => {
    const res = await get()
    for (const f of PRIVATE_SETTINGS_FIELDS) expect(res.body, f).not.toHaveProperty(f)
  })

  it('REGRESSION S4: hidden on every locale and with ?locale=all', async () => {
    for (const locale of ['de', 'ar', 'en', 'all']) {
      const res = await get(null, locale)
      expect(res.status, locale).toBe(200)
      expect(res.text, locale).not.toContain(SETTINGS_PRIVATE.boardEmail)
      for (const f of PRIVATE_SETTINGS_FIELDS) expect(res.body, `${locale}:${f}`).not.toHaveProperty(f)
    }
  })

  it('unrelated public SiteSettings fields remain available', async () => {
    const res = await get()
    for (const f of PUBLIC_SETTINGS_FIELDS) expect(res.body, f).toHaveProperty(f)
    expect(res.body.orgName).toBe('QA Org')
  })

  it('control: anonymous cannot update the global', async () => {
    const res = await api.post('/api/globals/site-settings', { orgName: 'pwned' })
    expect(res.status).toBe(403)
  })
})

describe('S4 — authenticated roles', () => {
  it.each(['viewer', 'editor'] as const)('%s does not receive the private fields either', async (role) => {
    const res = await get(fx.tokens[role])
    expect(res.status).toBe(200)
    expect(res.text).not.toContain(SETTINGS_PRIVATE.boardEmail)
    for (const f of PRIVATE_SETTINGS_FIELDS) expect(res.body, f).not.toHaveProperty(f)
  })

  it.each(['board', 'admin'] as const)('%s still reads boardNotificationEmails and the retention settings', async (role) => {
    const res = await get(fx.tokens[role])
    expect(res.status).toBe(200)
    expect(res.body.boardNotificationEmails.map((e: { email: string }) => e.email)).toContain(SETTINGS_PRIVATE.boardEmail)
    expect(res.body.submissionRetentionMonths).toBe(SETTINGS_PRIVATE.submissionRetentionMonths)
    expect(res.body.expertApplicationRetentionMonths).toBe(SETTINGS_PRIVATE.expertApplicationRetentionMonths)
  })

  it('board can still edit the recipient list (admin-panel workflow) and the change persists', async () => {
    const extra = 'qa-board-second@test.invalid'
    const update = await api.post(
      '/api/globals/site-settings',
      { boardNotificationEmails: [{ email: SETTINGS_PRIVATE.boardEmail }, { email: extra }] },
      fx.tokens.board,
    )
    expect(update.status, update.text.slice(0, 300)).toBe(200)
    const after = await get(fx.tokens.board)
    expect(after.body.boardNotificationEmails.map((e: { email: string }) => e.email)).toEqual([SETTINGS_PRIVATE.boardEmail, extra])
    // and it is still hidden from the public
    expect((await get()).text).not.toContain(extra)
  })
})

describe('S4 — the review notification still reaches the SiteSettings recipients', () => {
  it('editor submits news for review → board email is addressed to boardNotificationEmails (Local API read is unaffected)', async () => {
    const created = await api.post('/api/news', { title: 'QA S4 notify', slug: `qa-s4-notify-${Date.now()}`, reviewStatus: 'draft' }, fx.tokens.editor)
    expect(created.status, created.text.slice(0, 200)).toBe(201)
    const moved = await api.patch(`/api/news/${created.body.doc.id}`, { reviewStatus: 'in_review' }, fx.tokens.editor)
    expect(moved.status).toBe(200)
    const mail = await waitForMail((m) => m.data.includes('QA S4 notify'))
    writeEvidence('s4-review-notification-recipients', { to: mail?.to ?? null })
    expect(mail, 'review notification email was sent').toBeDefined()
    expect(mail!.to).toContain(SETTINGS_PRIVATE.boardEmail)
  })
})

describe('S4 — public website still renders from SiteSettings', () => {
  it('homepage renders and does not contain the board address', async () => {
    const res = await fetch(`${fx.baseUrl}/de`, { signal: AbortSignal.timeout(180_000) })
    const html = await res.text()
    expect(res.status).toBe(200)
    expect(html).not.toContain(SETTINGS_PRIVATE.boardEmail)
  })
})
